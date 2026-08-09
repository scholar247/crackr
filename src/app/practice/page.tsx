import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { PracticeBrowser } from './practice-browser';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const examRows = await taxonomyRepository.listPublicExams();
  const exams = examRows.map(({ exam, programName }) => ({
    id: exam.id,
    slug: exam.slug,
    name: exam.name,
    programName,
  }));

  return <PracticeBrowser exams={exams} />;
}
