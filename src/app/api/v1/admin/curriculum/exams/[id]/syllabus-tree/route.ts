import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiSuccess } from '@/lib/utils';

// Powers the question form's cascading Subject -> Chapter -> Topic -> Subtopic picker,
// scoped to whichever exam is selected as "Exam Category".
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const { id } = await params;
  return apiSuccess(await taxonomyRepository.getSyllabusTree(id));
}
