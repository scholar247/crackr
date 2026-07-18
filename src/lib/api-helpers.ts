import { auth } from '@/lib/auth';
import { apiError } from '@/lib/utils';
import type { UserRole } from '@/types';

/**
 * Validates the SEED_API_KEY from the Authorization header.
 * Accepts:  Authorization: Bearer <key>
 *           Authorization: Basic base64(anything:<key>)
 * Returns a Response on failure, null on success.
 */
export function requireApiKey(req: Request): Response | null {
  const key = process.env.SEED_API_KEY;
  if (!key) return apiError('Seed API not enabled — set SEED_API_KEY', 503);

  const auth = req.headers.get('authorization') ?? '';

  if (auth.startsWith('Bearer ') && auth.slice(7) === key) return null;

  if (auth.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
      const password = decoded.split(':').slice(1).join(':');
      if (password === key) return null;
    } catch { /* fall through */ }
  }

  return apiError('Invalid API key', 401);
}

/**
 * Guards the /api/cron/ai/* job routes. Accepts either the CRON_SECRET bearer token (for an
 * external scheduler / Vercel Cron) OR an authenticated EDITOR+ session (for the admin
 * "Run now" button) — same route, two legitimate callers.
 */
export async function requireCronSecretOrAuth(req: Request): Promise<Response | null> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  if (secret && auth === `Bearer ${secret}`) return null;

  const { error } = await requireAuth('EDITOR');
  return error;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 0,
  REVIEWER: 1,
  EDITOR: 1,
  TEACHER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export async function requireAuth(minRole?: UserRole) {
  const session = await auth();

  if (!session?.user) {
    return { session: null, error: apiError('Unauthorized', 401) };
  }

  if (minRole) {
    const userLevel = ROLE_HIERARCHY[session.user.role];
    const requiredLevel = ROLE_HIERARCHY[minRole];
    if (userLevel < requiredLevel) {
      return { session: null, error: apiError('Forbidden', 403) };
    }
  }

  return { session, error: null };
}

export function isAdmin(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['ADMIN'];
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}
