import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/utils';
import { meetsMinRole, type UserRole } from '@/lib/roles';
import { userRepository } from '@/server/repositories/user.repository';

// No backing `users` row — write paths that need a real FK (e.g. article.authorId) must
// treat this id as "no author" rather than persist it, hence `isServiceKey` on the return.
const SEED_USER = {
  id: 'seed-script',
  role: 'ADMIN' as UserRole,
  onboardingCompleted: true,
  name: 'Seed script',
  email: null,
};

// Real `users` row (seeded via scripts/seed-default-author.ts) that service-key/seed-script
// writes attribute content to instead of leaving authorId/updatedBy null.
export const DEFAULT_CONTENT_AUTHOR_ID = 'e9a8ccc8-342e-4080-9ba8-c416a42ece5a';

/**
 * The single place an API route resolves "who is making this request." That's either a
 * next-auth session cookie (web), or an `x-api-key` header matching `SEED_API_KEY` for
 * server-to-server bulk ingestion (seed scripts) — both funnel through this one chokepoint
 * instead of routes reading the session or the header directly.
 *
 * Re-checks role/status against the DB on every session-cookie call rather than trusting
 * the JWT, so a role change or account disable takes effect immediately instead of waiting
 * for token refresh.
 */
export async function requireAuth(minRole?: UserRole) {
  const apiKey = (await headers()).get('x-api-key');
  if (apiKey !== null) {
    if (!process.env.SEED_API_KEY || apiKey !== process.env.SEED_API_KEY) {
      return { session: null, error: apiError('Unauthorized', 401) };
    }
    if (minRole && !meetsMinRole(SEED_USER.role, minRole)) {
      return { session: null, error: apiError('Forbidden', 403) };
    }
    return { session: { user: SEED_USER }, error: null, isServiceKey: true as const };
  }

  const session = await auth();

  if (!session?.user) {
    return { session: null, error: apiError('Unauthorized', 401) };
  }

  const snapshot = await userRepository.getAuthorizationSnapshot(session.user.id);
  if (!snapshot || snapshot.status === 'DISABLED') {
    return { session: null, error: apiError('Unauthorized', 401) };
  }

  if (minRole && !meetsMinRole(snapshot.role, minRole)) {
    return { session: null, error: apiError('Forbidden', 403) };
  }

  return {
    session: {
      ...session,
      user: { ...session.user, role: snapshot.role, onboardingCompleted: snapshot.onboardingCompleted },
    },
    error: null,
    isServiceKey: false as const,
  };
}

/**
 * Same DB-snapshot re-check as requireAuth(), but for read-only routes that should answer
 * PUBLIC data to anonymous callers instead of 401ing — never returns an error. A caller
 * with no/invalid session or a disabled account gets `{ userId: null, role: null }`, which
 * repository functions treat as "PUBLIC only, no membership" (see
 * communityRepository.findVisibleToUser/canView). Only for GET routes — every mutating
 * route stays on requireAuth().
 */
export async function optionalAuth(): Promise<{ userId: string | null; role: UserRole | null }> {
  const session = await auth();
  if (!session?.user) return { userId: null, role: null };

  const snapshot = await userRepository.getAuthorizationSnapshot(session.user.id);
  if (!snapshot || snapshot.status === 'DISABLED') return { userId: null, role: null };

  return { userId: session.user.id, role: snapshot.role };
}
