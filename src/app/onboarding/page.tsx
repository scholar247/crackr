import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { defaultDashboardPath } from '@/lib/roles';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) redirect('/sign-in');

  // Not session.user.onboardingCompleted — see the comment on this same check in
  // DashboardPage. Re-reading from the DB here matters more than it might seem: it's
  // what stops a user who just finished onboarding from landing back on this page and
  // re-doing it if the JWT hasn't picked up the change yet.
  const snapshot = await userRepository.getAuthorizationSnapshot(session.user.id);
  if (snapshot?.onboardingCompleted) redirect(defaultDashboardPath(session.user.role));

  const examRows = await taxonomyRepository.listPublicExams();
  const exams = examRows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return <OnboardingClient name={session.user.name ?? ''} role={session.user.role} exams={exams} />;
}
