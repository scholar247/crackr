import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Onboarding is a nudge, not a gate — an authenticated user can reach the app
  // immediately; pages that benefit from it (e.g. the dashboard) show a prompt instead
  // of blocking access. See DashboardPage for the "complete onboarding" card.
  return <AppShell role={session.user.role}>{children}</AppShell>;
}
