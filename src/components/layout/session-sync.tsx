'use client';

/**
 * Detects when the JWT role is stale (e.g. role changed directly in DB) and
 * silently refreshes the session, then redirects to the correct dashboard.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'EDITOR', 'REVIEWER'];

interface SessionSyncProps {
  dbRole: UserRole;
}

export function SessionSync({ dbRole }: SessionSyncProps) {
  const { data: session, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) return;
    if (session.user.role === dbRole) return;

    // JWT role is stale — refresh then redirect to the correct landing
    update().then(() => {
      if (ADMIN_ROLES.includes(dbRole)) {
        router.replace('/admin/dashboard');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
