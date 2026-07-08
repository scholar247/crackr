import { apiError, apiSuccess } from '@/lib/utils';
import { blogService } from '@/server/services/blog.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const blog = await blogService.getBySlug(slug, true);
  if (!blog || blog.status !== 'PUBLISHED') return apiError('Blog not found', 404);

  const related = await blogService.getRelated(blog);
  return apiSuccess({ blog, related });
}
