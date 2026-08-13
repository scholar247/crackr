import { z } from 'zod';
import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { ARTICLE_STATUS_VALUES } from '@/schemas/article.schema';
import { apiError, apiSuccess } from '@/lib/utils';

const BulkStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: z.enum(ARTICLE_STATUS_VALUES),
});

// Admin-only, same rule as the question bank's bulk-status route — bulk status changes
// (including publish) from the article list are an admin action, not a teacher one.
export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = BulkStatusSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const editorId = isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id;
  const updated = await articleRepository.setStatusMany(parsed.data.ids, parsed.data.status, editorId);
  return apiSuccess(updated);
}
