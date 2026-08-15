import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { userRepository } from '@/server/repositories/user.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { ProfileClient } from './profile-client';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const [user, examTargets, programs, examRows] = await Promise.all([
    userRepository.findById(session.user.id),
    userRepository.findExamTargetsByUserId(session.user.id),
    taxonomyRepository.listPublicPrograms(),
    taxonomyRepository.listPublicExams(),
  ]);

  if (!user) redirect('/sign-in');

  const exams = examRows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return (
    <ProfileClient
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        college: user.college,
        degree: user.degree,
        passingYear: user.passingYear,
        targetYear: user.targetYear,
        level: user.level,
        targetProgramId: user.targetProgramId,
      }}
      examTargets={examTargets}
      programs={programs.map((p) => ({ id: p.id, name: p.name }))}
      exams={exams}
    />
  );
}
