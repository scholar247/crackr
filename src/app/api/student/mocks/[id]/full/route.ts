import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { mockRepository } from '@/server/repositories/mock.repository';
import { mcqRepository } from '@/server/repositories/mcq.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const mock = await mockRepository.findById(id);
  if (!mock || mock.userId !== session!.user.id) return apiError('Mock not found', 404);

  const mcqs = await mcqRepository.findByIds(mock.mcqIds);
  const mcqMap = new Map(mcqs.map((m) => [m.id, m]));
  const orderedMcqs = mock.mcqIds.map((mid) => mcqMap.get(mid)).filter(Boolean);

  return apiSuccess({ mock, mcqs: orderedMcqs });
}
