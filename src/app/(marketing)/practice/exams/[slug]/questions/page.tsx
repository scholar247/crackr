import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { PracticeBrowser } from './practice-browser';

export const dynamic = 'force-dynamic';

// Public — anyone can attempt questions here. Signed-in users will get their answers
// saved to build progress/analytics (once that write path exists); anonymous visitors
// can still practice, answers just aren't persisted anywhere for them.
export default async function PracticeQuestionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();

  const { slug } = await params;
  const exam = await taxonomyRepository.findExamBySlug(slug);
  if (!exam || exam.status !== 'ACTIVE') notFound();

  const syllabus = await taxonomyRepository.getSyllabusTree(exam.id);

  return (
    <PracticeBrowser
      examId={exam.id}
      examName={exam.name}
      examSlug={exam.slug}
      syllabus={syllabus}
      loggedIn={!!session?.user}
    />
  );
}
