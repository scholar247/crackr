import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { mockService } from '@/server/services/mock.service';

export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const result = await mockService.getUserMocks(session!.user.id, { page, pageSize });
  return apiSuccess(result.items, { total: result.total, page, pageSize });
}
