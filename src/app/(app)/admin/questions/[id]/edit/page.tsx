import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { parseContentId } from '@/lib/utils';
import { QuestionForm } from '../../question-form';

export const dynamic = 'force-dynamic';

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questionId = parseContentId(id);
  if (questionId === null) notFound();

  const [session, question, examRows] = await Promise.all([
    auth(),
    questionRepository.findById(questionId),
    taxonomyRepository.listExams(),
  ]);

  if (!question) notFound();

  const examOptions = examRows.map(({ exam }) => ({ id: exam.id, name: exam.name }));

  return <QuestionForm mode="edit" examOptions={examOptions} canPublish={isAdmin(session!.user.role)} initial={question} />;
}
