import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { CreateArticleSchema, ARTICLE_STATUS_VALUES } from '@/schemas/article.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(req: Request) {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const status = ARTICLE_STATUS_VALUES.includes(statusParam as (typeof ARTICLE_STATUS_VALUES)[number])
    ? (statusParam as (typeof ARTICLE_STATUS_VALUES)[number])
    : undefined;
  const authorId = searchParams.get('authorId') ?? undefined;
  const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50));

  const { rows, total } = await articleRepository.findAll({ status, authorId, sort, page, limit });
  return apiSuccess(rows, { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const parsed = CreateArticleSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const authorId = isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id;
  const article = await articleRepository.create(parsed.data, authorId);
  return apiSuccess(article, undefined, 201);
}
