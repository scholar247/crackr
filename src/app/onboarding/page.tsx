import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { defaultDashboardPath } from '@/lib/roles';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) redirect('/sign-in');
  if (session.user.onboardingCompleted) redirect(defaultDashboardPath(session.user.role));

  return <OnboardingClient name={session.user.name ?? ''} />;
}
