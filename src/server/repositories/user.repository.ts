import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/server/db/client';
import { users, authAccounts, userExamTargets, exams, programs } from '@/server/db/schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { assessmentRepository } from './assessment.repository';
import type { UserRole } from '@/lib/roles';
import type { PrepLevel } from '@/lib/prep-level';
import type { UpdateUserInput } from '@/schemas/user.schema';
import type { UpdateProfileInput } from '@/schemas/profile.schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface CompleteOnboardingInput {
  targetYear: number;
  level: PrepLevel;
  primaryExamId: string;
  additionalExamIds: string[];
}

interface ProvisionGoogleUserInput {
  email: string;
  name?: string | null;
  image?: string | null;
  providerAccountId: string;
}

interface RecordGoogleLoginInput {
  userId: string;
  name?: string | null;
  image?: string | null;
}

export interface AuthorizationSnapshot {
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  onboardingCompleted: boolean;
}

async function findByProviderIdentity(provider: string, providerAccountId: string) {
  const rows = await db
    .select({ user: users })
    .from(authAccounts)
    .innerJoin(users, eq(authAccounts.userId, users.id))
    .where(and(eq(authAccounts.provider, provider), eq(authAccounts.providerAccountId, providerAccountId)))
    .limit(1);

  return rows[0]?.user ?? null;
}

/**
 * Resolves the app user for a Google sign-in, creating one on first login. Provider
 * identity (auth_accounts) is the authoritative lookup — email is only a fallback so an
 * admin-provisioned user (created before their first login) gets linked correctly.
 */
async function provisionGoogleUser(input: ProvisionGoogleUserInput) {
  const existing = await findByProviderIdentity('google', input.providerAccountId);
  if (existing) return existing;

  const [byEmail] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

  let user = byEmail;
  if (!user) {
    // MySQL has no RETURNING clause — insert with a known id, then read the row back so
    // the caller gets the full record (including DB-assigned defaults like createdAt).
    const id = randomUUID();
    await db.insert(users).values({ id, email: input.email, name: input.name, image: input.image });
    [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    // A group-test organizer may have invited this email before the person ever signed
    // up — this converts any such pending invites into real access now that there's a
    // real account to grant it to. Only worth checking on genuine first-signup, not
    // every login, since a claimed/revoked invite never becomes claimable again.
    await assessmentRepository.claimPendingInvitesForEmail(user.id, input.email);
  }

  try {
    await db.insert(authAccounts).values({ userId: user.id, provider: 'google', providerAccountId: input.providerAccountId });
  } catch (err) {
    // Emulates ON CONFLICT DO NOTHING — a concurrent sign-in may have inserted this
    // provider identity a moment earlier, which is fine, not an error.
    if (!isDuplicateKeyError(err)) throw err;
  }

  return user;
}

async function recordGoogleLogin({ userId, name, image }: RecordGoogleLoginInput) {
  await db
    .update(users)
    .set({ name: name ?? undefined, image: image ?? undefined, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

async function getAuthorizationSnapshot(userId: string): Promise<AuthorizationSnapshot | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  return {
    role: user.role,
    status: user.status,
    onboardingCompleted: user.onboardingCompletedAt !== null,
  };
}

/**
 * Replaces a user's exam targets wholesale rather than diffing — every caller (onboarding,
 * profile edits) always submits the complete intended set, so delete-then-insert is simpler
 * and just as correct as a diff would be. Takes a transaction handle so callers can wrap
 * this alongside a `users` column write in one atomic operation.
 */
async function setExamTargets(tx: Tx, userId: string, examIds: string[], primaryExamId: string) {
  const uniqueIds = Array.from(new Set([primaryExamId, ...examIds]));
  await tx.delete(userExamTargets).where(eq(userExamTargets.userId, userId));
  await tx.insert(userExamTargets).values(uniqueIds.map((examId) => ({ userId, examId, isPrimary: examId === primaryExamId })));
}

/**
 * Records the learner's exam targets alongside marking onboarding done. Wrapped in a
 * transaction so a partial write never leaves the user marked onboarded without their
 * exam targets actually saved, or vice versa.
 */
async function completeOnboarding(userId: string, input: CompleteOnboardingInput) {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ onboardingCompletedAt: new Date(), targetYear: input.targetYear, level: input.level, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await setExamTargets(tx, userId, input.additionalExamIds, input.primaryExamId);
  });
}

async function findById(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

// Lowercases the lookup value — Google's OAuth email claim (the only sign-in path this
// app has) is itself already lowercase, so this matches how every row actually got
// written without needing a LOWER() comparison in SQL.
async function findByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return row ?? null;
}

// Batch form for group-test invite resolution — one query instead of one per invited
// email, which matters once an organizer pastes in a few hundred addresses.
async function findManyByEmails(emails: string[]) {
  if (emails.length === 0) return [];
  return db.select().from(users).where(inArray(users.email, emails.map((e) => e.toLowerCase())));
}

async function listRecent(limit = 10) {
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}

async function update(id: string, input: UpdateUserInput) {
  await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, id));
  return findById(id);
}

// Never read back until now — user_exam_targets is written once at onboarding and
// otherwise dead data. Joins to exams + programs so the profile page can show real
// names, not just ids. Excludes exams that have since been archived — a target on an
// archived exam is treated the same as having no target at all (homepage's
// incomplete-profile branch, see prd/homepage-session-aware-revamp.md Section 11), and
// Settings shouldn't display a re-selectable target for an exam that no longer exists
// in the active catalog either.
async function findExamTargetsByUserId(userId: string) {
  return db
    .select({ examId: exams.id, examName: exams.name, examSlug: exams.slug, programName: programs.name, isPrimary: userExamTargets.isPrimary })
    .from(userExamTargets)
    .innerJoin(exams, eq(userExamTargets.examId, exams.id))
    .innerJoin(programs, eq(exams.programId, programs.id))
    .where(and(eq(userExamTargets.userId, userId), eq(exams.status, 'ACTIVE')));
}

/**
 * Self-service profile update (settings page) — a `users` column update plus, only when
 * the caller is also updating exam targets, a `setExamTargets` call, both in one
 * transaction so the two never land inconsistently.
 */
async function updateProfile(userId: string, input: UpdateProfileInput) {
  const { examIds, primaryExamId, ...columns } = input;

  await db.transaction(async (tx) => {
    if (Object.keys(columns).length > 0) {
      await tx.update(users).set({ ...columns, updatedAt: new Date() }).where(eq(users.id, userId));
    }
    if (examIds && primaryExamId) {
      await setExamTargets(tx, userId, examIds, primaryExamId);
    }
  });

  return findById(userId);
}

export const userRepository = {
  findByProviderIdentity,
  provisionGoogleUser,
  recordGoogleLogin,
  getAuthorizationSnapshot,
  completeOnboarding,
  findById,
  findByEmail,
  findManyByEmails,
  listRecent,
  update,
  findExamTargetsByUserId,
  updateProfile,
};
