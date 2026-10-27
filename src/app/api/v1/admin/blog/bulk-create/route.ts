import { z } from 'zod';
import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { CreateArticleSchema } from '@/schemas/article.schema';
import { apiError, apiSuccess } from '@/lib/utils';

const BulkCreateSchema = z.array(CreateArticleSchema).min(1).max(50);

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const parsed = BulkCreateSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const authorId = isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id;

  // Sequential, not Promise.all: each create() dedupes its slug against what's already in
  // the DB, so two articles in the same batch sharing a title must be inserted one at a
  // time or they'd both compute the same "unclaimed" slug and collide.
  const created = [];
  for (const input of parsed.data) {
    created.push(await articleRepository.create(input, authorId));
  }

  return apiSuccess(created, undefined, 201);
}
