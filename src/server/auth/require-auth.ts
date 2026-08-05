import { auth } from '@/lib/auth';
import { apiError } from '@/lib/utils';
import { meetsMinRole, type UserRole } from '@/lib/roles';
import { userRepository } from '@/server/repositories/user.repository';

/**
 * The single place an API route resolves "who is making this request." Today that's a
 * next-auth session cookie (web only). A future mobile client would plug a bearer-token
 * strategy in here — behind this same function, without touching any route handler,
 * because every route already goes through this chokepoint instead of reading the
 * session directly.
 *
 * Re-checks role/status against the DB on every call rather than trusting the JWT, so a
 * role change or account disable takes effect immediately instead of waiting for token
 * refresh.
 */
export async function requireAuth(minRole?: UserRole) {
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
  };
}
