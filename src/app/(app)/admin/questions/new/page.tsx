import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { QuestionForm } from '../question-form';

export const dynamic = 'force-dynamic';

export default async function NewQuestionPage() {
  const session = await auth();
  const examRows = await taxonomyRepository.listExams();
  const examOptions = examRows.map(({ exam }) => ({ id: exam.id, name: exam.name }));

  return <QuestionForm mode="create" examOptions={examOptions} canPublish={isAdmin(session!.user.role)} />;
}
