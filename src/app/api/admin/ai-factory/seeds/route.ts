import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { contentSeedRepository } from '@/server/repositories/ai-seed.repository';
import { SeedListQuerySchema } from '@/schemas/ai-seed.schema';

export async function GET(req: Request) {
  const { error } = await requireAuth('EDITOR');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parsed = SeedListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query params' }, { status: 400 });
  }

  const result = await contentSeedRepository.list(parsed.data);
  return apiSuccess(result.items, {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
