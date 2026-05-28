import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const exam = await examRepository.findById(id);
  if (!exam) return apiError('Exam not found', 404);
  return apiSuccess(exam);
}
