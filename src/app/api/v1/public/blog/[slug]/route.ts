import { articleRepository } from '@/server/repositories/article.repository';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await articleRepository.findPublishedBySlug(slug);
  if (!article) return apiError('Not found', 404);

  return apiSuccess(article);
}
