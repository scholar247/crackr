import { randomUUID } from 'crypto';
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { isDuplicateKeyError } from '@/server/db/helpers';
import {
  assessments,
  assessmentSections,
  assessmentQuestions,
  assessmentAccess,
  assessmentAttempts,
  attemptResponses,
  assessmentChallenges,
  assessmentPendingInvites,
  userAudienceMap,
  users,
} from '@/server/db/schema';
import type { QuestionOption } from '@/server/db/schema/content';
import { questionRepository } from './question.repository';
import type { UserRole } from '@/lib/roles';
import { isAdmin } from '@/lib/roles';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface SectionInput {
  title: string;
  nodeId?: string;
  questionCount: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  marks: number;
  negativeMarks: number;
}

interface QuestionSnapshot {
  stem: string;
  options: QuestionOption[];
  explanation: string | null;
  difficulty: string;
}

// Thrown when one or more sections can't be filled from the published question bank —
// carries every shortfall at once (not just the first) so the create UI can show a
// complete picture rather than a fix-one-try-again loop.
export class AssessmentValidationError extends Error {
  issues: { section: string; requested: number; available: number }[];
  constructor(issues: AssessmentValidationError['issues']) {
    super('Not enough published questions for one or more sections');
    this.issues = issues;
  }
}

// Every attempt-lifecycle function below throws plain Error(CODE) rather than a typed
// exception per case — this map is the one place API routes translate those codes into
// HTTP statuses, so the mapping can't drift between the five routes that need it.
export const ASSESSMENT_ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  ATTEMPT_CLOSED: 409,
  ATTEMPT_IN_PROGRESS: 409,
  QUESTION_NOT_IN_ASSESSMENT: 400,
  MAX_ATTEMPTS_REACHED: 409,
  CHALLENGE_NOT_ACCEPTED: 409,
  CHALLENGE_NOT_STARTED: 409,
  NOT_YET_AVAILABLE: 409,
  WINDOW_CLOSED: 409,
  ALREADY_ATTEMPTED: 409,
  CANNOT_CHALLENGE_SELF: 400,
  CHALLENGE_ALREADY_RESOLVED: 409,
};

// ── Question pool selection & snapshotting ──────────────────────────────────

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Resolves each section's question pool against the published bank — reuses
// questionRepository.listPublished's exam+node+difficulty filtering (node filtering
// already reaches every descendant transitively, since tagging a question writes the
// full ancestor chain as SUPPLEMENTARY rows — see question.repository.ts's setNodeTag).
// Validates every section before returning anything, so a caller never has to unwind a
// partially-successful build. listPublished caps candidates at 200 — safely above
// MAX_QUESTIONS_PER_SECTION (100, see src/lib/assessment-limits.ts), so this never
// under-counts a real shortfall; it only means the random sample is drawn from the
// newest-200 matching questions rather than a larger bank, immaterial at today's scale.
async function resolveSectionPools(
  examId: string,
  sections: SectionInput[]
): Promise<Map<number, Awaited<ReturnType<typeof questionRepository.listPublished>>>> {
  const pools = new Map<number, Awaited<ReturnType<typeof questionRepository.listPublished>>>();
  const issues: AssessmentValidationError['issues'] = [];

  for (const [index, section] of sections.entries()) {
    const candidates = await questionRepository.listPublished({
      examId,
      nodeId: section.nodeId,
      difficulty: section.difficulty,
    });
    if (candidates.length < section.questionCount) {
      issues.push({ section: section.title, requested: section.questionCount, available: candidates.length });
    }
    pools.set(index, candidates);
  }

  if (issues.length > 0) throw new AssessmentValidationError(issues);
  return pools;
}

function toSnapshot(question: { stem: string; optionsJson: QuestionOption[]; explanation: string | null; difficulty: string }): QuestionSnapshot {
  return { stem: question.stem, options: question.optionsJson, explanation: question.explanation, difficulty: question.difficulty };
}

/** Strips isCorrect and explanation — the only shape ever sent to a client mid-attempt. */
// isCorrect/explanation are set to undefined rather than omitted, so both the stripped
// (mid-attempt) and full (post-submit) shapes are structurally identical — callers always
// see the same fields, just unpopulated while an attempt is live. explanation must be
// stripped too: it justifies the correct answer by definition, so leaving it in would hand
// the answer to anyone inspecting the network tab mid-exam.
export function stripAnswers(snapshot: QuestionSnapshot) {
  return {
    ...snapshot,
    explanation: undefined as string | null | undefined,
    options: snapshot.options.map(({ key, text }) => ({ key, text, isCorrect: undefined as boolean | undefined })),
  };
}

// Shared builder: validates pools, then inserts assessment + sections + frozen questions
// in one transaction. Used by createSelfMock now; createGroupTest/createChallenge (later
// phases) call the same function with type TEST/CHALLENGE.
async function createAssessmentWithSections(input: {
  type: 'MOCK' | 'TEST' | 'CHALLENGE';
  title: string;
  description?: string;
  creatorUserId: string;
  examId: string;
  sections: SectionInput[];
  durationSeconds: number;
  maxAttempts?: number | null;
  schedulingMode?: 'FIXED' | 'FLEXIBLE';
  startsAt?: Date;
  endsAt?: Date;
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC' | 'RESTRICTED';
}) {
  const pools = await resolveSectionPools(input.examId, input.sections);
  const assessmentId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(assessments).values({
      id: assessmentId,
      type: input.type,
      title: input.title,
      description: input.description,
      creatorUserId: input.creatorUserId,
      visibility: input.visibility ?? 'PRIVATE',
      status: 'PUBLISHED',
      examId: input.examId,
      durationSeconds: input.durationSeconds,
      schedulingMode: input.schedulingMode ?? 'FLEXIBLE',
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxAttempts: input.maxAttempts ?? undefined,
    });

    let position = 0;
    for (const [index, section] of input.sections.entries()) {
      const sectionId = randomUUID();
      await tx.insert(assessmentSections).values({
        id: sectionId,
        assessmentId,
        title: section.title,
        nodeId: section.nodeId,
        position: index,
        questionCount: section.questionCount,
        difficulty: section.difficulty,
        defaultMarks: String(section.marks),
        defaultNegativeMarks: String(section.negativeMarks),
      });

      const chosen = shuffle(pools.get(index)!).slice(0, section.questionCount);
      for (const question of chosen) {
        await tx.insert(assessmentQuestions).values({
          assessmentId,
          questionId: question.id,
          sectionId,
          position: position++,
          marks: String(section.marks),
          negativeMarks: String(section.negativeMarks),
          questionSnapshot: toSnapshot(question),
        });
      }
    }
  });

  return findByIdWithSections(assessmentId);
}

async function createSelfMock(input: {
  title: string;
  description?: string;
  examId: string;
  sections: SectionInput[];
  durationSeconds: number;
  maxAttempts?: number | null;
  creatorUserId: string;
}) {
  return createAssessmentWithSections({ ...input, type: 'MOCK', visibility: 'PRIVATE' });
}

// ── Group tests: invites, participants ──────────────────────────────────────

// Email resolution (existing account vs. not-yet-registered) happens in the API route,
// not here — assessment.repository.ts deliberately never imports user.repository.ts,
// since user.repository.ts already imports this file (for claimPendingInvitesForEmail
// on signup) and a two-way dependency between them would be a circular import.
export interface GroupTestInvite {
  matchedUserIds: string[];
  unmatchedEmails: string[];
  audienceIds: string[];
}

async function createGroupTest(input: {
  title: string;
  description?: string;
  examId: string;
  sections: SectionInput[];
  durationSeconds: number;
  maxAttempts?: number | null;
  schedulingMode: 'FIXED' | 'FLEXIBLE';
  startsAt: Date;
  endsAt: Date;
  organizerUserId: string;
  invite: GroupTestInvite;
}) {
  const created = await createAssessmentWithSections({
    type: 'TEST',
    title: input.title,
    description: input.description,
    creatorUserId: input.organizerUserId,
    examId: input.examId,
    sections: input.sections,
    durationSeconds: input.durationSeconds,
    maxAttempts: input.maxAttempts,
    schedulingMode: input.schedulingMode,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    visibility: 'RESTRICTED',
  });
  if (!created) throw new Error('NOT_FOUND');

  await grantGroupTestAccess(created.assessment.id, input.organizerUserId, input.invite);
  return findByIdWithSections(created.assessment.id);
}

// Shared by createGroupTest and the "invite more people later" route. Duplicate-key
// errors (re-inviting someone already granted, or an email already PENDING for this
// exact assessment — see assessment_pending_invites' unique index) are swallowed as a
// harmless no-op, same convention as taxonomy.repository.ts's attachNodeToExam.
async function grantGroupTestAccess(assessmentId: string, invitedByUserId: string, invite: GroupTestInvite) {
  await db.transaction(async (tx) => {
    for (const userId of invite.matchedUserIds) {
      try {
        await tx.insert(assessmentAccess).values({ id: randomUUID(), assessmentId, accessType: 'USER', userId });
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }
    for (const audienceId of invite.audienceIds) {
      try {
        await tx.insert(assessmentAccess).values({ id: randomUUID(), assessmentId, accessType: 'AUDIENCE', audienceId });
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }
    for (const email of invite.unmatchedEmails) {
      try {
        await tx.insert(assessmentPendingInvites).values({ id: randomUUID(), assessmentId, email: email.toLowerCase(), invitedByUserId, status: 'PENDING' });
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }
  });
}

// Organizer-only roster: every directly-invited user, every user reachable via an
// invited audience, and every still-pending email invite — each resolved user's most
// recent attempt (if any) attached, so the organizer can see who's done.
async function listParticipants(assessmentId: string) {
  const directUsers = await db
    .select({ userId: assessmentAccess.userId, name: users.name, email: users.email })
    .from(assessmentAccess)
    .innerJoin(users, eq(users.id, assessmentAccess.userId))
    .where(and(eq(assessmentAccess.assessmentId, assessmentId), eq(assessmentAccess.accessType, 'USER')));

  const viaAudience = await db
    .select({ accessId: assessmentAccess.id, userId: userAudienceMap.userId, name: users.name, email: users.email })
    .from(assessmentAccess)
    .innerJoin(userAudienceMap, eq(userAudienceMap.audienceId, assessmentAccess.audienceId))
    .innerJoin(users, eq(users.id, userAudienceMap.userId))
    .where(and(eq(assessmentAccess.assessmentId, assessmentId), eq(assessmentAccess.accessType, 'AUDIENCE')));

  const pendingInvites = await db
    .select({ id: assessmentPendingInvites.id, email: assessmentPendingInvites.email, createdAt: assessmentPendingInvites.createdAt })
    .from(assessmentPendingInvites)
    .where(and(eq(assessmentPendingInvites.assessmentId, assessmentId), eq(assessmentPendingInvites.status, 'PENDING')));

  const attempts = await db
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.assessmentId, assessmentId))
    .orderBy(desc(assessmentAttempts.startedAt));
  const latestAttemptByUser = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (!latestAttemptByUser.has(attempt.userId)) latestAttemptByUser.set(attempt.userId, attempt);
  }

  const byUserId = new Map<string, { userId: string; name: string | null; email: string; accessId: string | null }>();
  for (const row of directUsers) {
    if (row.userId) byUserId.set(row.userId, { userId: row.userId, name: row.name, email: row.email, accessId: null });
  }
  for (const row of viaAudience) {
    if (!byUserId.has(row.userId)) byUserId.set(row.userId, { userId: row.userId, name: row.name, email: row.email, accessId: null });
  }

  return {
    participants: Array.from(byUserId.values()).map((u) => ({ ...u, attempt: latestAttemptByUser.get(u.userId) ?? null })),
    pendingInvites,
  };
}

// Revokes a specific invitee's access — only before they've started an attempt, so a
// live/completed participant's history is never silently pulled out from under them.
async function revokeAccess(assessmentId: string, accessId: string) {
  const [row] = await db
    .select()
    .from(assessmentAccess)
    .where(and(eq(assessmentAccess.id, accessId), eq(assessmentAccess.assessmentId, assessmentId)))
    .limit(1);
  if (!row) throw new Error('NOT_FOUND');

  if (row.userId) {
    const attempted = await countAttemptsByUser(assessmentId, row.userId);
    if (attempted > 0) throw new Error('ALREADY_ATTEMPTED');
  }

  await db.delete(assessmentAccess).where(eq(assessmentAccess.id, accessId));
}

async function revokePendingInvite(assessmentId: string, inviteId: string) {
  const [row] = await db
    .select()
    .from(assessmentPendingInvites)
    .where(and(eq(assessmentPendingInvites.id, inviteId), eq(assessmentPendingInvites.assessmentId, assessmentId)))
    .limit(1);
  if (!row) throw new Error('NOT_FOUND');

  await db.update(assessmentPendingInvites).set({ status: 'REVOKED' }).where(eq(assessmentPendingInvites.id, inviteId));
}

// ── Challenges: create, respond, start, compare ─────────────────────────────

// Opponent resolution (existing account only — no pending-invite path for a live 1v1,
// see /api/v1/assessments/lookup-user) happens in the route, same one-directional
// dependency reasoning as group-test invites.
async function createChallenge(input: {
  title: string;
  description?: string;
  examId: string;
  sections: SectionInput[];
  durationSeconds: number;
  challengerUserId: string;
  opponentUserId: string;
}) {
  if (input.challengerUserId === input.opponentUserId) throw new Error('CANNOT_CHALLENGE_SELF');

  const created = await createAssessmentWithSections({
    type: 'CHALLENGE',
    title: input.title,
    description: input.description,
    creatorUserId: input.challengerUserId,
    examId: input.examId,
    sections: input.sections,
    durationSeconds: input.durationSeconds,
    maxAttempts: 1,
    visibility: 'RESTRICTED',
  });
  if (!created) throw new Error('NOT_FOUND');
  const assessmentId = created.assessment.id;

  await db.transaction(async (tx) => {
    await tx.insert(assessmentChallenges).values({ assessmentId, challengerUserId: input.challengerUserId, opponentUserId: input.opponentUserId, status: 'PENDING' });
    await tx.insert(assessmentAccess).values([
      { id: randomUUID(), assessmentId, accessType: 'USER', userId: input.challengerUserId },
      { id: randomUUID(), assessmentId, accessType: 'USER', userId: input.opponentUserId },
    ]);
  });

  return findChallengeById(assessmentId);
}

async function findChallengeById(assessmentId: string) {
  const [challenge] = await db.select().from(assessmentChallenges).where(eq(assessmentChallenges.assessmentId, assessmentId)).limit(1);
  return challenge ?? null;
}

async function respondToChallenge(assessmentId: string, userId: string, accept: boolean) {
  const challenge = await findChallengeById(assessmentId);
  if (!challenge) throw new Error('NOT_FOUND');
  if (challenge.opponentUserId !== userId) throw new Error('FORBIDDEN');
  if (challenge.status !== 'PENDING') throw new Error('CHALLENGE_ALREADY_RESOLVED');

  await db
    .update(assessmentChallenges)
    .set({ status: accept ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() })
    .where(eq(assessmentChallenges.assessmentId, assessmentId));
  return findChallengeById(assessmentId);
}

// Race-safe/idempotent: only the first call actually sets startsAt (the WHERE clause
// stops matching once it's set), so whichever party clicks "Start Now" first wins and
// the other party's click just observes the same locked-in moment — no separate
// distributed lock needed.
async function startChallenge(assessmentId: string, userId: string) {
  const challenge = await findChallengeById(assessmentId);
  if (!challenge) throw new Error('NOT_FOUND');
  if (challenge.challengerUserId !== userId && challenge.opponentUserId !== userId) throw new Error('FORBIDDEN');
  if (challenge.status !== 'ACCEPTED') throw new Error('CHALLENGE_NOT_ACCEPTED');

  await db
    .update(assessments)
    .set({ startsAt: new Date() })
    .where(and(eq(assessments.id, assessmentId), isNull(assessments.startsAt)));

  return findById(assessmentId);
}

async function listIncomingChallenges(userId: string) {
  return db
    .select({ challenge: assessmentChallenges, assessment: assessments, challengerName: users.name, challengerEmail: users.email })
    .from(assessmentChallenges)
    .innerJoin(assessments, eq(assessments.id, assessmentChallenges.assessmentId))
    .innerJoin(users, eq(users.id, assessmentChallenges.challengerUserId))
    .where(and(eq(assessmentChallenges.opponentUserId, userId), eq(assessmentChallenges.status, 'PENDING')))
    .orderBy(desc(assessments.createdAt));
}

// Head-to-head once both attempts exist — "pending" (no comparison yet) until both
// parties have at least started. Champion = higher score, tie-broken by lower total time.
async function getChallengeComparison(assessmentId: string, userId: string) {
  const challenge = await findChallengeById(assessmentId);
  if (!challenge) throw new Error('NOT_FOUND');
  if (challenge.challengerUserId !== userId && challenge.opponentUserId !== userId) throw new Error('FORBIDDEN');

  const [challengerUser, opponentUser] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, challenge.challengerUserId)).limit(1).then((r) => r[0]),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, challenge.opponentUserId)).limit(1).then((r) => r[0]),
  ]);

  const [challengerAttempt, opponentAttempt] = await Promise.all([
    findLatestCompletedAttempt(assessmentId, challenge.challengerUserId),
    findLatestCompletedAttempt(assessmentId, challenge.opponentUserId),
  ]);

  let championUserId: string | null = null;
  if (challengerAttempt && opponentAttempt) {
    const challengerScore = Number(challengerAttempt.score ?? 0);
    const opponentScore = Number(opponentAttempt.score ?? 0);
    if (challengerScore !== opponentScore) {
      championUserId = challengerScore > opponentScore ? challenge.challengerUserId : challenge.opponentUserId;
    } else {
      const challengerTime = challengerAttempt.timeSpentSeconds ?? Infinity;
      const opponentTime = opponentAttempt.timeSpentSeconds ?? Infinity;
      championUserId = challengerTime <= opponentTime ? challenge.challengerUserId : challenge.opponentUserId;
    }
  }

  return {
    challenge,
    challenger: { ...challengerUser, attempt: challengerAttempt },
    opponent: { ...opponentUser, attempt: opponentAttempt },
    championUserId,
  };
}

// ── Reads ────────────────────────────────────────────────────────────────────

async function findById(id: string) {
  const [row] = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return row ?? null;
}

async function findByIdWithSections(id: string) {
  const assessment = await findById(id);
  if (!assessment) return null;

  const sections = await db
    .select()
    .from(assessmentSections)
    .where(eq(assessmentSections.assessmentId, id))
    .orderBy(assessmentSections.position);

  const questionCounts = await db
    .select({ sectionId: assessmentQuestions.sectionId, assessmentId: assessmentQuestions.assessmentId })
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, id));

  const countsBySection = new Map<string, number>();
  for (const row of questionCounts) {
    if (!row.sectionId) continue;
    countsBySection.set(row.sectionId, (countsBySection.get(row.sectionId) ?? 0) + 1);
  }

  return {
    assessment,
    sections: sections.map((s) => ({ ...s, actualQuestionCount: countsBySection.get(s.id) ?? 0 })),
    totalQuestions: questionCounts.length,
  };
}

// Hard-deletes only when nothing has attempted it yet (cascades cleanly via FKs); once
// any attempt exists — including on a shared group test — a hard delete would erase real
// participant history, so it's archived instead. Caller (the route) is responsible for
// checking creator/admin authorization before calling this.
async function deleteOrArchive(id: string) {
  const existingAttempts = await db
    .select({ id: assessmentAttempts.id })
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.assessmentId, id))
    .limit(1);

  if (existingAttempts.length > 0) {
    await db.update(assessments).set({ status: 'ARCHIVED' }).where(eq(assessments.id, id));
    return { archived: true as const };
  }

  await db.delete(assessments).where(eq(assessments.id, id));
  return { archived: false as const };
}

// Central authorization chokepoint every attempt/detail route runs through. True if the
// caller created it, is an admin, or has a resolvable assessmentAccess grant (direct user
// match, or membership in a granted audience). Challenge parties are covered too, since
// challenge creation also writes ordinary assessmentAccess rows for both users.
async function checkAccess(assessmentId: string, userId: string, role: UserRole): Promise<boolean> {
  if (isAdmin(role)) return true;

  const assessment = await findById(assessmentId);
  if (!assessment) return false;
  if (assessment.creatorUserId === userId) return true;

  const [direct] = await db
    .select({ id: assessmentAccess.id })
    .from(assessmentAccess)
    .where(
      and(
        eq(assessmentAccess.assessmentId, assessmentId),
        or(
          and(eq(assessmentAccess.accessType, 'USER'), eq(assessmentAccess.userId, userId)),
          eq(assessmentAccess.accessType, 'PUBLIC')
        )
      )
    )
    .limit(1);
  if (direct) return true;

  const [viaAudience] = await db
    .select({ id: assessmentAccess.id })
    .from(assessmentAccess)
    .innerJoin(userAudienceMap, eq(userAudienceMap.audienceId, assessmentAccess.audienceId))
    .where(
      and(
        eq(assessmentAccess.assessmentId, assessmentId),
        eq(assessmentAccess.accessType, 'AUDIENCE'),
        eq(userAudienceMap.userId, userId)
      )
    )
    .limit(1);
  return Boolean(viaAudience);
}

// The window a user is actually allowed to *start* a TEST within — distinct from
// checkAccess (which only gates whether they can see it at all). Prefers a per-user
// override on their own assessmentAccess row (direct USER grant first, then whichever
// AUDIENCE grant resolves), falling back to the assessment-level startsAt/endsAt. Both
// bounds null means unrestricted (the creator/an admin previewing it, or a MOCK, which
// never has a window at all).
async function resolveAccessWindow(assessmentId: string, userId: string): Promise<{ from: Date | null; until: Date | null }> {
  const assessment = await findById(assessmentId);
  if (!assessment) return { from: null, until: null };

  const [direct] = await db
    .select({ availableFrom: assessmentAccess.availableFrom, availableUntil: assessmentAccess.availableUntil })
    .from(assessmentAccess)
    .where(and(eq(assessmentAccess.assessmentId, assessmentId), eq(assessmentAccess.accessType, 'USER'), eq(assessmentAccess.userId, userId)))
    .limit(1);
  if (direct) return { from: direct.availableFrom ?? assessment.startsAt, until: direct.availableUntil ?? assessment.endsAt };

  const [viaAudience] = await db
    .select({ availableFrom: assessmentAccess.availableFrom, availableUntil: assessmentAccess.availableUntil })
    .from(assessmentAccess)
    .innerJoin(userAudienceMap, eq(userAudienceMap.audienceId, assessmentAccess.audienceId))
    .where(and(eq(assessmentAccess.assessmentId, assessmentId), eq(assessmentAccess.accessType, 'AUDIENCE'), eq(userAudienceMap.userId, userId)))
    .limit(1);
  if (viaAudience) return { from: viaAudience.availableFrom ?? assessment.startsAt, until: viaAudience.availableUntil ?? assessment.endsAt };

  return { from: assessment.startsAt, until: assessment.endsAt };
}

// Assessments visible to a user: created by them, or resolvable via access (direct or
// audience). Admins additionally get every assessment when scopeAll is passed.
async function findVisibleToUser(userId: string, role: UserRole, filters: { type?: string; scopeAll?: boolean } = {}) {
  if (isAdmin(role) && filters.scopeAll) {
    const conditions = filters.type ? [eq(assessments.type, filters.type as 'MOCK' | 'TEST' | 'CHALLENGE' | 'OFFICIAL')] : [];
    return db.select().from(assessments).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(assessments.createdAt));
  }

  const accessibleIds = await db
    .selectDistinct({ assessmentId: assessmentAccess.assessmentId })
    .from(assessmentAccess)
    .leftJoin(userAudienceMap, eq(userAudienceMap.audienceId, assessmentAccess.audienceId))
    .where(
      or(
        and(eq(assessmentAccess.accessType, 'USER'), eq(assessmentAccess.userId, userId)),
        and(eq(assessmentAccess.accessType, 'AUDIENCE'), eq(userAudienceMap.userId, userId))
      )
    );
  const ids = accessibleIds.map((r) => r.assessmentId);

  const visibilityCondition = ids.length > 0 ? or(eq(assessments.creatorUserId, userId), inArray(assessments.id, ids)) : eq(assessments.creatorUserId, userId);
  const conditions = filters.type ? [visibilityCondition, eq(assessments.type, filters.type as 'MOCK' | 'TEST' | 'CHALLENGE' | 'OFFICIAL')] : [visibilityCondition];

  return db.select().from(assessments).where(and(...conditions)).orderBy(desc(assessments.createdAt));
}

// ── Attempt lifecycle ────────────────────────────────────────────────────────

function computeDeadline(assessment: NonNullable<Awaited<ReturnType<typeof findById>>>, attempt: { startedAt: Date }): Date | null {
  if (!assessment.durationSeconds) return null;
  // CHALLENGE and FIXED-mode TEST share one deadline for every participant (assessments.startsAt);
  // everything else (MOCK, FLEXIBLE-mode TEST) gets its own deadline from when this attempt started.
  const sharedDeadline = assessment.type === 'CHALLENGE' || (assessment.type === 'TEST' && assessment.schedulingMode === 'FIXED');
  const base = sharedDeadline ? assessment.startsAt : attempt.startedAt;
  if (!base) return null;
  return new Date(base.getTime() + assessment.durationSeconds * 1000);
}

async function countAttemptsByUser(assessmentId: string, userId: string) {
  const rows = await db
    .select({ id: assessmentAttempts.id })
    .from(assessmentAttempts)
    .where(and(eq(assessmentAttempts.assessmentId, assessmentId), eq(assessmentAttempts.userId, userId)));
  return rows.length;
}

// Powers the lobby's Start-vs-Resume decision — an existing IN_PROGRESS attempt (not yet
// past its deadline) should be resumed, not silently abandoned by starting a new one.
async function findInProgressAttempt(assessmentId: string, userId: string) {
  const assessment = await findById(assessmentId);
  if (!assessment) return null;

  const rows = await db
    .select()
    .from(assessmentAttempts)
    .where(and(eq(assessmentAttempts.assessmentId, assessmentId), eq(assessmentAttempts.userId, userId), eq(assessmentAttempts.status, 'IN_PROGRESS')))
    .orderBy(desc(assessmentAttempts.startedAt))
    .limit(1);
  if (rows.length === 0) return null;

  const fresh = await expireIfPastDeadline(assessment, rows[0]);
  return fresh.status === 'IN_PROGRESS' ? fresh : null;
}

// Most recent completed attempt — powers the lobby's "View last results" shortcut.
async function findLatestCompletedAttempt(assessmentId: string, userId: string) {
  const rows = await db
    .select()
    .from(assessmentAttempts)
    .where(and(eq(assessmentAttempts.assessmentId, assessmentId), eq(assessmentAttempts.userId, userId)))
    .orderBy(desc(assessmentAttempts.startedAt))
    .limit(1);
  const attempt = rows[0];
  return attempt && attempt.status !== 'IN_PROGRESS' ? attempt : null;
}

async function startAttempt(assessmentId: string, userId: string, opts: { countsTowardProgress?: boolean } = {}) {
  const assessment = await findById(assessmentId);
  if (!assessment) throw new Error('NOT_FOUND');

  if (assessment.type === 'CHALLENGE') {
    const [challenge] = await db.select().from(assessmentChallenges).where(eq(assessmentChallenges.assessmentId, assessmentId)).limit(1);
    if (!challenge || challenge.status !== 'ACCEPTED') throw new Error('CHALLENGE_NOT_ACCEPTED');
    if (!assessment.startsAt) throw new Error('CHALLENGE_NOT_STARTED');
  }

  // Only TEST-type assessments enforce a start window — the entire point of the
  // group-test scheduling feature (a MOCK is always startable by its own creator; a
  // creator/admin previewing their own group test is exempt, same as checkAccess).
  if (assessment.type === 'TEST' && assessment.creatorUserId !== userId) {
    const window = await resolveAccessWindow(assessmentId, userId);
    const now = new Date();
    if (window.from && now < window.from) throw new Error('NOT_YET_AVAILABLE');
    if (window.until && now > window.until) throw new Error('WINDOW_CLOSED');
  }

  const existingCount = await countAttemptsByUser(assessmentId, userId);
  if (assessment.maxAttempts && existingCount >= assessment.maxAttempts) throw new Error('MAX_ATTEMPTS_REACHED');

  const attemptId = randomUUID();
  await db.insert(assessmentAttempts).values({
    id: attemptId,
    assessmentId,
    userId,
    attemptNumber: existingCount + 1,
    status: 'IN_PROGRESS',
    // TEST/CHALLENGE attempts always count — only a self-mock (MOCK) gets a real choice.
    countsTowardProgress: assessment.type === 'MOCK' ? (opts.countsTowardProgress ?? true) : true,
  });

  return getAttemptState(assessmentId, attemptId, userId);
}

// Lazily expires an attempt whose deadline has passed, scoring it from whatever
// responses were saved before the deadline — no background worker needed.
async function expireIfPastDeadline(assessment: NonNullable<Awaited<ReturnType<typeof findById>>>, attempt: typeof assessmentAttempts.$inferSelect) {
  if (attempt.status !== 'IN_PROGRESS') return attempt;
  const deadline = computeDeadline(assessment, attempt);
  if (!deadline || new Date() <= deadline) return attempt;

  await finalizeAttempt(assessment, attempt, 'EXPIRED');
  const [refreshed] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, attempt.id)).limit(1);
  return refreshed;
}

async function getAttemptState(assessmentId: string, attemptId: string, userId: string) {
  const assessment = await findById(assessmentId);
  if (!assessment) throw new Error('NOT_FOUND');

  const [attemptRow] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, attemptId)).limit(1);
  if (!attemptRow || attemptRow.assessmentId !== assessmentId) throw new Error('NOT_FOUND');
  if (attemptRow.userId !== userId) throw new Error('FORBIDDEN');

  const attempt = await expireIfPastDeadline(assessment, attemptRow);

  const questionRows = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .orderBy(assessmentQuestions.position);

  const responses = await db.select().from(attemptResponses).where(eq(attemptResponses.attemptId, attemptId));
  const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

  const deadline = computeDeadline(assessment, attempt);
  // Answers stay hidden for the live exam room; once the attempt is no longer
  // IN_PROGRESS (submitted or lazily expired) this doubles as the review payload, so the
  // correct option and how each response was actually graded are revealed.
  const inProgress = attempt.status === 'IN_PROGRESS';

  return {
    attempt,
    deadline: deadline?.toISOString() ?? null,
    questions: questionRows.map((q) => {
      const snapshot = q.questionSnapshot as QuestionSnapshot;
      const response = responseByQuestion.get(q.questionId);
      return {
        questionId: q.questionId,
        sectionId: q.sectionId,
        position: q.position,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        ...(inProgress ? stripAnswers(snapshot) : snapshot),
        selectedOptionKeys: response?.selectedOptionKeys ?? [],
        isCorrect: inProgress ? undefined : (response?.isCorrect ?? null),
        marksAwarded: inProgress ? undefined : (response?.marksAwarded ?? null),
        markedForReview: response?.markedForReview ?? false,
      };
    }),
  };
}

async function saveResponse(
  assessmentId: string,
  attemptId: string,
  userId: string,
  input: { questionId: number; selectedOptionKeys?: string[]; timeSpentSeconds?: number; markedForReview?: boolean }
) {
  const assessment = await findById(assessmentId);
  if (!assessment) throw new Error('NOT_FOUND');

  const [attemptRow] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, attemptId)).limit(1);
  if (!attemptRow || attemptRow.assessmentId !== assessmentId) throw new Error('NOT_FOUND');
  if (attemptRow.userId !== userId) throw new Error('FORBIDDEN');

  const attempt = await expireIfPastDeadline(assessment, attemptRow);
  if (attempt.status !== 'IN_PROGRESS') throw new Error('ATTEMPT_CLOSED');

  const [belongs] = await db
    .select({ questionId: assessmentQuestions.questionId })
    .from(assessmentQuestions)
    .where(and(eq(assessmentQuestions.assessmentId, assessmentId), eq(assessmentQuestions.questionId, input.questionId)))
    .limit(1);
  if (!belongs) throw new Error('QUESTION_NOT_IN_ASSESSMENT');

  const hasAnswer = Boolean(input.selectedOptionKeys && input.selectedOptionKeys.length > 0);

  await db
    .insert(attemptResponses)
    .values({
      id: randomUUID(),
      attemptId,
      questionId: input.questionId,
      selectedOptionKeys: input.selectedOptionKeys,
      timeSpentSeconds: input.timeSpentSeconds,
      markedForReview: input.markedForReview ?? false,
      answeredAt: hasAnswer ? new Date() : undefined,
    })
    .onDuplicateKeyUpdate({
      set: {
        selectedOptionKeys: input.selectedOptionKeys,
        timeSpentSeconds: input.timeSpentSeconds,
        markedForReview: input.markedForReview ?? false,
        answeredAt: hasAnswer ? new Date() : undefined,
      },
    });
}

// Grades every frozen question against saved responses, persists the per-response
// grading, and rolls the attempt up to a final score/percentage/section breakdown.
async function finalizeAttempt(
  assessment: NonNullable<Awaited<ReturnType<typeof findById>>>,
  attempt: typeof assessmentAttempts.$inferSelect,
  finalStatus: 'SUBMITTED' | 'EXPIRED'
) {
  const questionRows = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, attempt.assessmentId))
    .orderBy(assessmentQuestions.position);
  const responses = await db.select().from(attemptResponses).where(eq(attemptResponses.attemptId, attempt.id));
  const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

  let score = 0;
  let totalTimeSpent = 0;

  await db.transaction(async (tx) => {
    for (const q of questionRows) {
      const response = responseByQuestion.get(q.questionId);
      if (!response) continue;

      const snapshot = q.questionSnapshot as QuestionSnapshot;
      const correctKey = snapshot.options.find((o) => o.isCorrect)?.key;
      const selectedKey = response.selectedOptionKeys?.[0];
      const attempted = Boolean(selectedKey);
      const isCorrect = attempted ? selectedKey === correctKey : null;
      const marksAwarded = !attempted ? 0 : isCorrect ? Number(q.marks) : -Number(q.negativeMarks);

      score += marksAwarded;
      totalTimeSpent += response.timeSpentSeconds ?? 0;

      await tx.update(attemptResponses).set({ isCorrect, marksAwarded: String(marksAwarded) }).where(eq(attemptResponses.id, response.id));
    }

    const maxPossible = questionRows.reduce((sum, q) => sum + Number(q.marks), 0);
    const percentage = maxPossible > 0 ? (score / maxPossible) * 100 : 0;

    await tx
      .update(assessmentAttempts)
      .set({
        status: finalStatus,
        score: String(score),
        percentage: percentage.toFixed(2),
        timeSpentSeconds: totalTimeSpent,
        submittedAt: new Date(),
      })
      .where(eq(assessmentAttempts.id, attempt.id));
  });
}

async function submitAttempt(assessmentId: string, attemptId: string, userId: string) {
  const assessment = await findById(assessmentId);
  if (!assessment) throw new Error('NOT_FOUND');

  const [attemptRow] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, attemptId)).limit(1);
  if (!attemptRow || attemptRow.assessmentId !== assessmentId) throw new Error('NOT_FOUND');
  if (attemptRow.userId !== userId) throw new Error('FORBIDDEN');

  // Idempotent: a double-click or a race with the lazy-expiry check just returns the
  // already-final summary instead of erroring.
  if (attemptRow.status === 'IN_PROGRESS') {
    await finalizeAttempt(assessment, attemptRow, 'SUBMITTED');
  }

  return getResultsSummary(assessmentId, attemptId, userId);
}

async function getResultsSummary(assessmentId: string, attemptId: string, userId: string) {
  const assessment = await findById(assessmentId);
  if (!assessment) throw new Error('NOT_FOUND');

  const [attemptRow] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, attemptId)).limit(1);
  if (!attemptRow || attemptRow.assessmentId !== assessmentId) throw new Error('NOT_FOUND');
  if (attemptRow.userId !== userId) throw new Error('FORBIDDEN');
  if (attemptRow.status === 'IN_PROGRESS') throw new Error('ATTEMPT_IN_PROGRESS');

  const questionRows = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .orderBy(assessmentQuestions.position);
  const responses = await db.select().from(attemptResponses).where(eq(attemptResponses.attemptId, attemptId));
  const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

  const sections = await db
    .select()
    .from(assessmentSections)
    .where(eq(assessmentSections.assessmentId, assessmentId))
    .orderBy(assessmentSections.position);

  const bySection = new Map<string, { sectionId: string; title: string; total: number; attempted: number; correct: number; marks: number; maxMarks: number; timeSpentSeconds: number }>();
  for (const s of sections) bySection.set(s.id, { sectionId: s.id, title: s.title, total: 0, attempted: 0, correct: 0, marks: 0, maxMarks: 0, timeSpentSeconds: 0 });

  let attemptedCount = 0;
  let reviewedCount = 0;

  for (const q of questionRows) {
    const response = responseByQuestion.get(q.questionId);
    const bucket = q.sectionId ? bySection.get(q.sectionId) : undefined;
    if (bucket) {
      bucket.total += 1;
      bucket.maxMarks += Number(q.marks);
      if (response?.selectedOptionKeys?.length) {
        bucket.attempted += 1;
        if (response.isCorrect) bucket.correct += 1;
        bucket.marks += Number(response.marksAwarded ?? 0);
      }
      bucket.timeSpentSeconds += response?.timeSpentSeconds ?? 0;
    }
    if (response?.selectedOptionKeys?.length) attemptedCount += 1;
    if (response?.markedForReview) reviewedCount += 1;
  }

  return {
    attempt: attemptRow,
    totalQuestions: questionRows.length,
    attemptedCount,
    skippedCount: questionRows.length - attemptedCount,
    reviewedCount,
    sectionBreakdown: Array.from(bySection.values()),
  };
}

async function listMyAttempts(userId: string, filters: { countsTowardProgress?: boolean } = {}) {
  const conditions = [eq(assessmentAttempts.userId, userId)];
  if (filters.countsTowardProgress !== undefined) conditions.push(eq(assessmentAttempts.countsTowardProgress, filters.countsTowardProgress));

  return db
    .select({ attempt: assessmentAttempts, assessment: assessments })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessments.id, assessmentAttempts.assessmentId))
    .where(and(...conditions))
    .orderBy(desc(assessmentAttempts.startedAt));
}

// ── Pending-invite claim (called from user.repository.ts on new-account creation) ──

async function claimPendingInvitesForEmail(userId: string, email: string) {
  const normalized = email.toLowerCase();
  const pending = await db
    .select()
    .from(assessmentPendingInvites)
    .where(and(eq(assessmentPendingInvites.email, normalized), eq(assessmentPendingInvites.status, 'PENDING')));
  if (pending.length === 0) return;

  await db.transaction(async (tx) => {
    for (const invite of pending) {
      await tx.insert(assessmentAccess).values({
        id: randomUUID(),
        assessmentId: invite.assessmentId,
        accessType: 'USER',
        userId,
        availableFrom: invite.availableFrom,
        availableUntil: invite.availableUntil,
      });
      await tx
        .update(assessmentPendingInvites)
        .set({ status: 'CLAIMED', claimedByUserId: userId, claimedAt: new Date() })
        .where(eq(assessmentPendingInvites.id, invite.id));
    }
  });
}

export const assessmentRepository = {
  createSelfMock,
  createAssessmentWithSections,
  createGroupTest,
  grantGroupTestAccess,
  resolveAccessWindow,
  listParticipants,
  revokeAccess,
  revokePendingInvite,
  createChallenge,
  findChallengeById,
  respondToChallenge,
  startChallenge,
  listIncomingChallenges,
  getChallengeComparison,
  findById,
  findByIdWithSections,
  deleteOrArchive,
  checkAccess,
  findVisibleToUser,
  findInProgressAttempt,
  findLatestCompletedAttempt,
  startAttempt,
  getAttemptState,
  saveResponse,
  submitAttempt,
  getResultsSummary,
  listMyAttempts,
  claimPendingInvitesForEmail,
};
