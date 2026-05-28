import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const search = searchParams.get('search') ?? undefined;

  const result = await userRepository.findAll({ page, pageSize, search });
  return apiSuccess(result.items, { total: result.total, page, pageSize });
}
