import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { mockService } from '@/server/services/mock.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const mock = await mockService.getById(id, session!.user.id);
  if (!mock) return apiError('Mock session not found', 404);

  return apiSuccess(mock);
}
