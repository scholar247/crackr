import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const test = await testService.getById(id);
  if (!test) return apiError('Test not found', 404);
  return apiSuccess(test);
}
