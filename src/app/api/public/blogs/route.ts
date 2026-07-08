import { apiSuccess } from '@/lib/utils';
import { blogService } from '@/server/services/blog.service';
import { BlogListQuerySchema } from '@/schemas/blog.schema';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
const parsed = BlogListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query params' }, { status: 400 });
  }

  const result = await blogService.listPublished(parsed.data);
  return apiSuccess(result.items, {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
