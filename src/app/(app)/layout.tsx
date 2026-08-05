import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }
  if (!session.user.onboardingCompleted) {
    redirect('/onboarding');
  }

  return <AppShell role={session.user.role}>{children}</AppShell>;
}
