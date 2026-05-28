import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const tests = await testService.getForUser(session!.user.id);
  return apiSuccess(tests);
}
