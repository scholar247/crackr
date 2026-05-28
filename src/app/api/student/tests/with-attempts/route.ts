import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';
import { testRepository } from '@/server/repositories/test.repository';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const tests = await testService.getForUser(userId);
  const attempts = await Promise.all(tests.map((t) => testRepository.findUserAttempt(t.id, userId)));
  const enriched = tests.map((test, i) => ({ ...test, attempt: attempts[i] ?? null }));

  return apiSuccess(enriched);
}
