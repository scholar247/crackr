import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { blogService } from '@/server/services/blog.service';
import { UpdateBlogSchema } from '@/schemas/blog.schema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('EDITOR');
  if (error) return error;

  const { id } = await params;
  const blog = await blogService.getById(id);
  if (!blog) return apiError('Blog not found', 404);
  return apiSuccess(blog);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('EDITOR');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const blog = await blogService.update(id, parsed.data);
    if (!blog) return apiError('Blog not found', 404);
    return apiSuccess(blog);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const deleted = await blogService.delete(id);
  if (!deleted) return apiError('Blog not found', 404);
  return apiSuccess({ deleted: true });
}
