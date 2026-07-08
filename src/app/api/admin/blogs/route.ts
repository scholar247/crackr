import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { blogService } from '@/server/services/blog.service';
import { CreateBlogSchema, BlogListQuerySchema } from '@/schemas/blog.schema';

export async function GET(req: Request) {
  const { error } = await requireAuth('EDITOR');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parsed = BlogListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query params' }, { status: 400 });
  }

  const result = await blogService.list(parsed.data);
  return apiSuccess(result.items, {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth('EDITOR');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const blog = await blogService.create(
      parsed.data,
      session!.user.id,
      session!.user.email ?? ''
    );
    return apiSuccess(blog, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create blog';
    return Response.json({ error: message }, { status: 400 });
  }
}
