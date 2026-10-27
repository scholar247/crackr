import { requireAuth } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { apiSuccess } from '@/lib/utils';

// Powers the "Created By" filter dropdown on the admin blog list.
export async function GET() {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const authors = await articleRepository.listAuthors();
  return apiSuccess(authors);
}
