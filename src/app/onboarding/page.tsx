import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { defaultDashboardPath } from '@/lib/roles';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) redirect('/sign-in');
  if (session.user.onboardingCompleted) redirect(defaultDashboardPath(session.user.role));

  const examRows = await taxonomyRepository.listPublicExams();
  const exams = examRows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return <OnboardingClient name={session.user.name ?? ''} exams={exams} />;
}
