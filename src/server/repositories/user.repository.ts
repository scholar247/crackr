import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, authAccounts } from '@/server/db/schema';
import type { UserRole } from '@/lib/roles';

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

  const user =
    byEmail ??
    (
      await db
        .insert(users)
        .values({ email: input.email, name: input.name, image: input.image })
        .returning()
    )[0];

  await db
    .insert(authAccounts)
    .values({ userId: user.id, provider: 'google', providerAccountId: input.providerAccountId })
    .onConflictDoNothing();

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

async function completeOnboarding(userId: string) {
  await db.update(users).set({ onboardingCompletedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export const userRepository = {
  findByProviderIdentity,
  provisionGoogleUser,
  recordGoogleLogin,
  getAuthorizationSnapshot,
  completeOnboarding,
};
