import { apiSuccess } from '@/lib/utils';
import { mcqService } from '@/server/services/mcq.service';
import { MCQListQuerySchema } from '@/schemas';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = MCQListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query params', details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await mcqService.list({ ...parsed.data, isActive: true });
  return apiSuccess(result.items, {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
