import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id: examId } = await params;
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId') ?? undefined;

  const sections = await examRepository.getSectionsByExam(examId, subjectId);
  return apiSuccess(sections);
}
