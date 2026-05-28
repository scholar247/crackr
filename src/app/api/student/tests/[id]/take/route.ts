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
  if (!test || test.status !== 'PUBLISHED') return apiError('Test not found', 404);

  const attempt = await testService.startAttempt(id, session.user.id);

  const mcqIds = attempt.shuffledMcqIds ?? test.mcqIds;
  const mcqs = await mcqRepository.findByIds(mcqIds);
  const mcqMap = new Map(mcqs.map((m) => [m.id, m]));
  const ordered = mcqIds.map((mid) => mcqMap.get(mid)).filter(Boolean);

  const sanitized = (ordered as typeof mcqs).map((mcq) => ({
    ...mcq,
    options: mcq.options.map((o) => ({ ...o, isCorrect: false })),
  }));

  return apiSuccess({ test, attempt, mcqs: sanitized });
}
