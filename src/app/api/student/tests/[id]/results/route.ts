import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';
import { mcqRepository } from '@/server/repositories/mcq.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const test = await testService.getById(id);
  if (!test) return apiError('Test not found', 404);

  const attempt = await testService.getResults(id, session.user.id);
  if (!attempt) return apiError('No completed attempt found', 404);

  const mcqs = await mcqRepository.findByIds(attempt.shuffledMcqIds ?? test.mcqIds);
  const mcqMap = new Map(mcqs.map((m) => [m.id, m]));
  const ordered = (attempt.shuffledMcqIds ?? test.mcqIds)
    .map((mid) => mcqMap.get(mid))
    .filter(Boolean);

  return apiSuccess({ test, attempt, mcqs: ordered });
}
