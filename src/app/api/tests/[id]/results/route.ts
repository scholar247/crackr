import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const results = await testService.getResults(id, session!.user.id);
  if (!results) return apiError('No results found', 404);
  return apiSuccess(results);
}
