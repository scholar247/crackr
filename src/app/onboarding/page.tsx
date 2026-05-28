import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  try {
    const profile = await serverGet<{ onboardingCompleted?: boolean } | null>('/api/user/profile');
    if (profile?.onboardingCompleted === true) {
      redirect('/dashboard');
    }
  } catch {
    // If the check fails, let the client render (won't loop)
  }

  return <OnboardingClient />;
}
