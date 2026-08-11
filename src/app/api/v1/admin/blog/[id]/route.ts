import { requireAuth } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { UpdateArticleSchema } from '@/schemas/article.schema';
import { isAdmin } from '@/lib/roles';
import { apiError, apiSuccess, parseContentId } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const { id } = await params;
  const articleId = parseContentId(id);
  if (articleId === null) return apiError('Not found', 404);

  const article = await articleRepository.findById(articleId);
  if (!article) return apiError('Not found', 404);

  return apiSuccess(article);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const { id } = await params;
  const articleId = parseContentId(id);
  if (articleId === null) return apiError('Not found', 404);

  const existing = await articleRepository.findById(articleId);
  if (!existing) return apiError('Not found', 404);

  // Teachers can only edit their own articles; admins can edit any.
  if (!isAdmin(session!.user.role) && existing.authorId !== session!.user.id) {
    return apiError('Forbidden', 403);
  }

  const parsed = UpdateArticleSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const editorId = isServiceKey ? null : session!.user.id;
  const updated = await articleRepository.update(articleId, parsed.data, editorId);
  return apiSuccess(updated);
}
