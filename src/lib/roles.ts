// Single source of truth for the role enum — src/server/db/schema/identity.ts builds the
// Postgres enum from USER_ROLES rather than duplicating the list. Framework-agnostic and
// safe to import from client components.

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 0,
  TEACHER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function meetsMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

export function isAdmin(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Group-test/challenge invites: everyone can invite by email, but only teachers and
 * admins can assign by an existing user group (audience) — students only get email.
 */
export function canInviteAudience(role: UserRole): boolean {
  return meetsMinRole(role, 'TEACHER');
}

export function defaultDashboardPath(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'TEACHER':
      return '/teacher';
    case 'STUDENT':
      return '/dashboard';
  }
}

/**
 * Open-redirect guard for post-login `?callbackUrl=`. Only ever redirect to a same-origin,
 * app-internal path — never to an attacker-supplied absolute/external URL.
 */
export function assertInternalCallbackPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}
