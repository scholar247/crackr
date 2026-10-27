import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
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
  contentNodeMap,
  curriculumNodes,
  exams,
  userExamTargets,
} from '@/server/db/schema';
import type { QuestionOption } from '@/server/db/schema/content';
import { questionRepository } from './question.repository';
import { taxonomyRepository } from './taxonomy.repository';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';
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
  type: 'MOCK' | 'TEST' | 'CHALLENGE' | 'OFFICIAL';
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
  studentInstructions?: string;
  tags?: string[];
  bannerImage?: string;
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
      studentInstructions: input.studentInstructions,
      tags: input.tags,
      bannerImage: input.bannerImage,
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
  studentInstructions?: string;
  tags?: string[];
  bannerImage?: string;
}) {
  return createAssessmentWithSections({ ...input, type: 'MOCK', visibility: 'PRIVATE' });
}

// "Open" mock — every subject of the exam gets its own section automatically (built from
// the exam's own syllabus tree, never from client input, so a caller can't cherry-pick a
// subset), published PUBLIC, and open to anyone with this exam in their user_exam_targets
// rather than a hand-picked invite list. See checkAccess's PUBLIC branch for the actual
// eligibility gate enforced when someone tries to start it.
async function createOpenMock(input: {
  title: string;
  description?: string;
  examId: string;
  questionsPerSubject: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  durationSeconds: number;
  maxAttempts?: number | null;
  creatorUserId: string;
  studentInstructions?: string;
  tags?: string[];
  bannerImage?: string;
}) {
  const subjects = await taxonomyRepository.getSyllabusTree(input.examId);
  if (subjects.length === 0) throw new Error('EXAM_HAS_NO_SUBJECTS');
  if (subjects.length > ASSESSMENT_LIMITS.MAX_SECTIONS) throw new Error('TOO_MANY_SUBJECTS_FOR_ONE_MOCK');

  const sections: SectionInput[] = subjects.map((subject) => ({
    title: subject.name,
    nodeId: subject.id,
    questionCount: input.questionsPerSubject,
    difficulty: input.difficulty,
    marks: input.marksPerQuestion,
    negativeMarks: input.negativeMarksPerQuestion,
  }));

  const created = await createAssessmentWithSections({
    type: 'OFFICIAL',
    title: input.title,
    description: input.description,
    creatorUserId: input.creatorUserId,
    visibility: 'PUBLIC',
    examId: input.examId,
    sections,
    durationSeconds: input.durationSeconds,
    maxAttempts: input.maxAttempts,
    studentInstructions: input.studentInstructions,
    tags: input.tags,
    bannerImage: input.bannerImage,
  });

  await db.insert(assessmentAccess).values({ id: randomUUID(), assessmentId: created!.assessment.id, accessType: 'PUBLIC' });

  return created;
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
  studentInstructions?: string;
  tags?: string[];
  bannerImage?: string;
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
    studentInstructions: input.studentInstructions,
    tags: input.tags,
    bannerImage: input.bannerImage,
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
    .select({ id: assessmentAccess.id, accessType: assessmentAccess.accessType })
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
  if (direct) {
    // "Open to all" (createOpenMock) means open to everyone actually targeting this exam,
    // not literally anyone with the link — a direct USER grant (a specific invite) skips
    // this check same as always, only the PUBLIC grant carries it.
    if (direct.accessType === 'PUBLIC' && assessment.examId) {
      const [target] = await db
        .select({ userId: userExamTargets.userId })
        .from(userExamTargets)
        .where(and(eq(userExamTargets.userId, userId), eq(userExamTargets.examId, assessment.examId)))
        .limit(1);
      return Boolean(target);
    }
    return true;
  }

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

// Publicly discoverable mocks/tests for one exam — distinct from findVisibleToUser, which
// answers "what is *this specific viewer* entitled to see" (their own + directly
// shared/assigned). This answers "what's out there for this exam that anyone can start,"
// which is what the homepage's exam-scoped mocks section actually needs.
async function findPublicByExam(examId: string, limit = 4) {
  return db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.examId, examId),
        inArray(assessments.type, ['MOCK', 'TEST']),
        eq(assessments.status, 'PUBLISHED'),
        eq(assessments.visibility, 'PUBLIC')
      )
    )
    .orderBy(desc(assessments.createdAt))
    .limit(limit);
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
        // Per-question timing — only meaningful once the attempt is no longer live (the
        // results/summary page's speed-distribution chart), so withheld the same way
        // isCorrect/marksAwarded are while IN_PROGRESS.
        timeSpentSeconds: inProgress ? undefined : (response?.timeSpentSeconds ?? null),
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

// ── Reporting & analytics (organizer/admin) ─────────────────────────────────
// Everything below aggregates across every participant of a TEST/CHALLENGE assessment —
// the single-attempt result above (getResultsSummary) stays the one-participant view,
// this is the many-participant view. All three functions share one definition of
// "completed" (latest attempt is SUBMITTED or EXPIRED, i.e. not still IN_PROGRESS/
// ABANDONED) via getCompletedParticipants, so ranking/question-stats/topic-stats can
// never disagree about who counts.

async function getCompletedParticipants(assessmentId: string) {
  const { participants } = await listParticipants(assessmentId);
  return participants.filter(
    (p): p is typeof p & { attempt: NonNullable<(typeof p)['attempt']> } =>
      p.attempt !== null && (p.attempt.status === 'SUBMITTED' || p.attempt.status === 'EXPIRED'),
  );
}

// Ranked leaderboard + assessment-level aggregates for a TEST/CHALLENGE assessment.
// Backs both the organizer's enriched participant table and the participant-facing
// leaderboard — one ranking implementation, not two. Tie-break (score desc, then time
// taken asc) matches getChallengeComparison's DUET winner rule exactly, so a 1v1
// challenge and a 2-person group test rank identically for the same inputs.
async function getAssessmentReport(assessmentId: string) {
  const assessment = await findById(assessmentId);
  if (!assessment) throw new Error('NOT_FOUND');

  const [{ count: totalQuestions }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId));

  const { participants } = await listParticipants(assessmentId);
  const completed = await getCompletedParticipants(assessmentId);
  const attemptIds = completed.map((p) => p.attempt.id);

  const responseCounts = attemptIds.length
    ? await db
        .select({ attemptId: attemptResponses.attemptId, isCorrect: attemptResponses.isCorrect, count: sql<number>`count(*)` })
        .from(attemptResponses)
        .where(inArray(attemptResponses.attemptId, attemptIds))
        .groupBy(attemptResponses.attemptId, attemptResponses.isCorrect)
    : [];
  const correctByAttempt = new Map<string, number>();
  const wrongByAttempt = new Map<string, number>();
  for (const row of responseCounts) {
    if (row.isCorrect === true) correctByAttempt.set(row.attemptId, row.count);
    else if (row.isCorrect === false) wrongByAttempt.set(row.attemptId, row.count);
  }

  const rows = completed.map((p) => {
    const correct = correctByAttempt.get(p.attempt.id) ?? 0;
    const wrong = wrongByAttempt.get(p.attempt.id) ?? 0;
    const attempted = correct + wrong;
    return {
      userId: p.userId,
      name: p.name,
      email: p.email,
      attemptId: p.attempt.id,
      score: Number(p.attempt.score ?? 0),
      percentage: Number(p.attempt.percentage ?? 0),
      attempted,
      correct,
      wrong,
      unattempted: Math.max(0, totalQuestions - attempted),
      accuracy: attempted > 0 ? Number(((correct / attempted) * 100).toFixed(2)) : 0,
      timeSpentSeconds: p.attempt.timeSpentSeconds ?? 0,
      status: p.attempt.status,
    };
  });

  rows.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.timeSpentSeconds - b.timeSpentSeconds));
  const ranking = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  const completedCount = ranking.length;
  const scores = ranking.map((r) => r.score);
  const sortedScores = [...scores].sort((a, b) => a - b);
  const averageScore = completedCount ? scores.reduce((a, b) => a + b, 0) / completedCount : 0;
  const medianScore = completedCount
    ? completedCount % 2 === 1
      ? sortedScores[(completedCount - 1) / 2]
      : (sortedScores[completedCount / 2 - 1] + sortedScores[completedCount / 2]) / 2
    : 0;
  const averageAccuracy = completedCount ? ranking.reduce((a, r) => a + r.accuracy, 0) / completedCount : 0;

  return {
    totalQuestions,
    participantCount: participants.length,
    completedCount,
    averageScore: Number(averageScore.toFixed(2)),
    medianScore: Number(medianScore.toFixed(2)),
    highestScore: completedCount ? Math.max(...scores) : 0,
    lowestScore: completedCount ? Math.min(...scores) : 0,
    averageAccuracy: Number(averageAccuracy.toFixed(2)),
    ranking,
  };
}

// Per-question correct/wrong/skipped counts across every completed attempt — the
// "% of participants who got this right" view. skipped = completed attempts that never
// selected an option for this question (no response row, or a row with no selection).
async function getQuestionAnalytics(assessmentId: string) {
  const completed = await getCompletedParticipants(assessmentId);
  const attemptIds = completed.map((p) => p.attempt.id);
  const totalCompleted = attemptIds.length;

  const questionRows = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .orderBy(assessmentQuestions.position);

  const responseCounts = attemptIds.length
    ? await db
        .select({ questionId: attemptResponses.questionId, isCorrect: attemptResponses.isCorrect, count: sql<number>`count(*)` })
        .from(attemptResponses)
        .where(inArray(attemptResponses.attemptId, attemptIds))
        .groupBy(attemptResponses.questionId, attemptResponses.isCorrect)
    : [];
  const correctByQuestion = new Map<number, number>();
  const wrongByQuestion = new Map<number, number>();
  for (const row of responseCounts) {
    if (row.isCorrect === true) correctByQuestion.set(row.questionId, row.count);
    else if (row.isCorrect === false) wrongByQuestion.set(row.questionId, row.count);
  }

  const pct = (n: number) => (totalCompleted ? Number(((n / totalCompleted) * 100).toFixed(1)) : 0);

  const questionStats = questionRows.map((q) => {
    const snapshot = q.questionSnapshot as QuestionSnapshot;
    const correct = correctByQuestion.get(q.questionId) ?? 0;
    const wrong = wrongByQuestion.get(q.questionId) ?? 0;
    const skipped = Math.max(0, totalCompleted - correct - wrong);
    return {
      questionId: q.questionId,
      position: q.position,
      stem: snapshot.stem,
      difficulty: snapshot.difficulty,
      correct,
      wrong,
      skipped,
      correctPct: pct(correct),
      wrongPct: pct(wrong),
      skippedPct: pct(skipped),
    };
  });

  const hardestQuestionId = questionStats.length ? [...questionStats].sort((a, b) => a.correctPct - b.correctPct)[0].questionId : null;
  const mostSkippedQuestionId = questionStats.length ? [...questionStats].sort((a, b) => b.skippedPct - a.skippedPct)[0].questionId : null;

  return { totalCompleted, questions: questionStats, hardestQuestionId, mostSkippedQuestionId };
}

// Rolls the same per-question correct/wrong counts up by each question's tagged
// subject/chapter (content_node_map's PRIMARY tag — the exact leaf node the question
// was tagged with, not the propagated SUPPLEMENTARY ancestor rows question.repository.ts
// also writes for filtering purposes).
async function getTopicAnalytics(assessmentId: string) {
  const completed = await getCompletedParticipants(assessmentId);
  const attemptIds = completed.map((p) => p.attempt.id);
  const totalCompleted = attemptIds.length;

  const questionRows = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessmentId));
  const questionIds = questionRows.map((q) => q.questionId);

  const topicTags = questionIds.length
    ? await db
        .select({ questionId: contentNodeMap.contentId, nodeId: contentNodeMap.nodeId, nodeName: curriculumNodes.name })
        .from(contentNodeMap)
        .innerJoin(curriculumNodes, eq(curriculumNodes.id, contentNodeMap.nodeId))
        .where(and(eq(contentNodeMap.contentType, 'QUESTION'), inArray(contentNodeMap.contentId, questionIds), eq(contentNodeMap.relationType, 'PRIMARY')))
    : [];
  const topicByQuestion = new Map(topicTags.map((t) => [t.questionId, { nodeId: t.nodeId, nodeName: t.nodeName }]));

  const responseCounts = attemptIds.length
    ? await db
        .select({ questionId: attemptResponses.questionId, isCorrect: attemptResponses.isCorrect, count: sql<number>`count(*)` })
        .from(attemptResponses)
        .where(inArray(attemptResponses.attemptId, attemptIds))
        .groupBy(attemptResponses.questionId, attemptResponses.isCorrect)
    : [];
  const correctByQuestion = new Map<number, number>();
  const wrongByQuestion = new Map<number, number>();
  for (const row of responseCounts) {
    if (row.isCorrect === true) correctByQuestion.set(row.questionId, row.count);
    else if (row.isCorrect === false) wrongByQuestion.set(row.questionId, row.count);
  }

  interface TopicBucket {
    nodeId: string;
    nodeName: string;
    questionCount: number;
    attempted: number;
    correct: number;
  }
  const byTopic = new Map<string, TopicBucket>();
  for (const q of questionRows) {
    const topic = topicByQuestion.get(q.questionId);
    const key = topic?.nodeId ?? 'untagged';
    const bucket = byTopic.get(key) ?? { nodeId: key, nodeName: topic?.nodeName ?? 'Untagged', questionCount: 0, attempted: 0, correct: 0 };
    bucket.questionCount += 1;
    bucket.attempted += (correctByQuestion.get(q.questionId) ?? 0) + (wrongByQuestion.get(q.questionId) ?? 0);
    bucket.correct += correctByQuestion.get(q.questionId) ?? 0;
    byTopic.set(key, bucket);
  }

  const topics = Array.from(byTopic.values())
    .map((t) => ({
      nodeId: t.nodeId,
      nodeName: t.nodeName,
      questionCount: t.questionCount,
      attempted: t.attempted,
      accuracy: t.attempted > 0 ? Number(((t.correct / t.attempted) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.attempted - a.attempted);

  return { totalCompleted, topics };
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

// Open mocks (createOpenMock) across every exam a user targets — not just their primary
// one, per the homepage's "any of the exams the user has opted into" requirement. Callers
// already have listMyAttempts for "have I attempted this" (reuse it, don't re-query), and
// should only call getAssessmentReport per-mock for the small subset actually attempted.
async function findOpenMocksForExams(examIds: string[], limit = 5) {
  if (examIds.length === 0) return [];
  return db
    .select()
    .from(assessments)
    .where(
      and(
        inArray(assessments.examId, examIds),
        eq(assessments.type, 'OFFICIAL'),
        eq(assessments.status, 'PUBLISHED'),
        eq(assessments.visibility, 'PUBLIC')
      )
    )
    .orderBy(desc(assessments.createdAt))
    .limit(limit);
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

// ── Progress tracking ──

export interface ProgressSeriesPoint {
  // 1-based — "this was your Nth mock touching this exam/subject/chapter," which is
  // exactly what the progress charts plot on the x-axis (not a calendar timeline).
  attemptNumber: number;
  percentage: number;
  submittedAt: string | null;
}

export interface ProgressGroup {
  id: string | null;
  name: string;
  /** examSlug for 'exam'; nodeType (SUBJECT/CHAPTER) for 'subject'/'chapter'. */
  meta: string;
  totalAttempts: number;
  avgPercentage: number;
  bestPercentage: number;
  latestPercentage: number;
  trend: 'up' | 'down' | 'flat';
  series: ProgressSeriesPoint[];
}

function buildGroupFromSeries(id: string | null, name: string, meta: string, chronological: { percentage: number; submittedAt: Date | null }[]): ProgressGroup {
  const series = chronological.map((a, i) => ({
    attemptNumber: i + 1,
    percentage: a.percentage,
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
  }));
  const percentages = series.map((s) => s.percentage);
  const latest = percentages[percentages.length - 1] ?? 0;
  const prev = percentages[percentages.length - 2];
  return {
    id,
    name,
    meta,
    totalAttempts: series.length,
    avgPercentage: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
    bestPercentage: Math.max(...percentages),
    latestPercentage: latest,
    trend: prev === undefined ? 'flat' : latest > prev ? 'up' : latest < prev ? 'down' : 'flat',
    series,
  };
}

// Exam-level: the attempt's own overall percentage already means "score for this exam" —
// no need to touch sections/questions, and critically, no join that could fan out one
// attempt into several rows (a prior version left-joined assessment_sections here, which
// silently multiplied totalAttempts by each mock's section count).
async function getExamProgress(userId: string): Promise<ProgressGroup[]> {
  const attempts = await db
    .select({
      percentage: assessmentAttempts.percentage,
      submittedAt: assessmentAttempts.submittedAt,
      examId: assessments.examId,
    })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessments.id, assessmentAttempts.assessmentId))
    .where(and(
      eq(assessmentAttempts.userId, userId),
      eq(assessmentAttempts.status, 'SUBMITTED'),
      eq(assessmentAttempts.countsTowardProgress, true),
    ))
    .orderBy(asc(assessmentAttempts.submittedAt));

  const byExam = new Map<string, { percentage: number; submittedAt: Date | null }[]>();
  for (const a of attempts) {
    const key = a.examId ?? 'UNKNOWN';
    if (!byExam.has(key)) byExam.set(key, []);
    byExam.get(key)!.push({ percentage: parseFloat(a.percentage as unknown as string) || 0, submittedAt: a.submittedAt });
  }

  const examIds = Array.from(byExam.keys()).filter((id) => id !== 'UNKNOWN');
  const examDetails = new Map<string, { name: string; slug: string }>();
  if (examIds.length > 0) {
    const rows = await db.select({ id: exams.id, name: exams.name, slug: exams.slug }).from(exams).where(inArray(exams.id, examIds));
    for (const r of rows) examDetails.set(r.id, { name: r.name, slug: r.slug });
  }

  return Array.from(byExam.entries()).map(([examId, series]) => {
    const detail = examId !== 'UNKNOWN' ? examDetails.get(examId) : undefined;
    return buildGroupFromSeries(examId === 'UNKNOWN' ? null : examId, detail?.name ?? 'Unknown Exam', detail?.slug ?? 'general', series);
  });
}

// Subject/chapter-level: an attempt's overall percentage can't be attributed to any one
// subject (a mock mixing Maths + CS sections might be acing Maths and failing CS) — the
// only accurate source is per-question scoring, rolled up by the section's curriculum
// node. Matches curriculumNodes.nodeType exactly (SUBJECT vs CHAPTER), so a node only
// shows up in the tab it actually belongs to instead of a fabricated "Chapter N" label.
async function getNodeProgress(userId: string, nodeType: 'SUBJECT' | 'CHAPTER'): Promise<ProgressGroup[]> {
  const rows = await db
    .select({
      attemptId: assessmentAttempts.id,
      submittedAt: assessmentAttempts.submittedAt,
      nodeId: assessmentSections.nodeId,
      marksAwarded: attemptResponses.marksAwarded,
      marks: assessmentQuestions.marks,
    })
    .from(assessmentAttempts)
    .innerJoin(attemptResponses, eq(attemptResponses.attemptId, assessmentAttempts.id))
    .innerJoin(
      assessmentQuestions,
      and(eq(assessmentQuestions.assessmentId, assessmentAttempts.assessmentId), eq(assessmentQuestions.questionId, attemptResponses.questionId))
    )
    .innerJoin(assessmentSections, eq(assessmentSections.id, assessmentQuestions.sectionId))
    .where(and(
      eq(assessmentAttempts.userId, userId),
      eq(assessmentAttempts.status, 'SUBMITTED'),
      eq(assessmentAttempts.countsTowardProgress, true),
    ));

  // Roll up per (attempt, node) first — one attempt can touch a node through several
  // questions, and we want one score per node per mock, not one row per question.
  const byAttemptNode = new Map<string, { nodeId: string; submittedAt: Date | null; scored: number; max: number }>();
  for (const r of rows) {
    if (!r.nodeId) continue; // section pulls "from anywhere in the exam" — not attributable to one node
    const key = `${r.attemptId}:${r.nodeId}`;
    if (!byAttemptNode.has(key)) byAttemptNode.set(key, { nodeId: r.nodeId, submittedAt: r.submittedAt, scored: 0, max: 0 });
    const entry = byAttemptNode.get(key)!;
    entry.scored += Number(r.marksAwarded) || 0;
    entry.max += Number(r.marks) || 0;
  }

  // Then group those per-mock node scores by node, chronologically, for the trend series.
  const byNode = new Map<string, { percentage: number; submittedAt: Date | null }[]>();
  for (const entry of byAttemptNode.values()) {
    if (entry.max <= 0) continue;
    if (!byNode.has(entry.nodeId)) byNode.set(entry.nodeId, []);
    byNode.get(entry.nodeId)!.push({ percentage: (entry.scored / entry.max) * 100, submittedAt: entry.submittedAt });
  }
  for (const series of byNode.values()) series.sort((a, b) => (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0));

  const nodeIds = Array.from(byNode.keys());
  if (nodeIds.length === 0) return [];

  const nodes = await db
    .select({ id: curriculumNodes.id, name: curriculumNodes.name, nodeType: curriculumNodes.nodeType })
    .from(curriculumNodes)
    .where(inArray(curriculumNodes.id, nodeIds));
  const nodeDetails = new Map(nodes.map((n) => [n.id, { name: n.name, nodeType: n.nodeType }]));

  return Array.from(byNode.entries())
    .filter(([nodeId]) => nodeDetails.get(nodeId)?.nodeType === nodeType)
    .map(([nodeId, series]) => buildGroupFromSeries(nodeId, nodeDetails.get(nodeId)!.name, nodeType, series));
}

async function getUserProgress(userId: string, type: 'exam' | 'subject' | 'chapter'): Promise<ProgressGroup[]> {
  if (type === 'exam') return getExamProgress(userId);
  return getNodeProgress(userId, type === 'subject' ? 'SUBJECT' : 'CHAPTER');
}

export const assessmentRepository = {
  createSelfMock,
  createOpenMock,
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
  findPublicByExam,
  findOpenMocksForExams,
  findInProgressAttempt,
  findLatestCompletedAttempt,
  startAttempt,
  getAttemptState,
  saveResponse,
  submitAttempt,
  getResultsSummary,
  getAssessmentReport,
  getQuestionAnalytics,
  getTopicAnalytics,
  listMyAttempts,
  claimPendingInvitesForEmail,
  getUserProgress,
};
