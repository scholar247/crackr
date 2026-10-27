import { articleRepository } from '@/server/repositories/article.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET() {
  const articles = await articleRepository.findPublished();
  return apiSuccess(articles);
}
