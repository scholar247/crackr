import { auth } from '@/lib/auth';
import { apiError } from '@/lib/utils';
import type { UserRole } from '@/types';

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
