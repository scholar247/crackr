import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { StudentSidebar } from '@/components/layout/student-sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SessionSync } from '@/components/layout/session-sync';
import type { UserRole } from '@/types';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'EDITOR', 'REVIEWER'];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  let layoutData: { role: string; onboardingCompleted: boolean; targetExams: { id: string; name: string; slug: string }[] } | null = null;
  try {
    layoutData = await serverGet('/api/student/layout');
  } catch { /* ok */ }

  if (!layoutData?.onboardingCompleted) {
    redirect('/onboarding');
  }

  // If DB role is elevated but JWT is stale, SessionSync will refresh + redirect.
  // We still render the layout so the client has a page context to run the effect in.
  const dbRole = (layoutData?.role ?? session.user.role) as UserRole;
  const jwtRole = session.user.role as UserRole;
  const roleStale = dbRole !== jwtRole;

  const targetExams = layoutData?.targetExams ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {roleStale && <SessionSync dbRole={dbRole} />}
      <StudentSidebar targetExams={targetExams} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
