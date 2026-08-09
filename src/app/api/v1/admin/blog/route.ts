import { requireAuth } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { CreateArticleSchema } from '@/schemas/article.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET() {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const articles = await articleRepository.findAll();
  return apiSuccess(articles);
}

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const parsed = CreateArticleSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const authorId = isServiceKey ? null : session!.user.id;
  const article = await articleRepository.create(parsed.data, authorId);
  return apiSuccess(article, undefined, 201);
}
