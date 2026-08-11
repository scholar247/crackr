import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { questionRepository } from '@/server/repositories/question.repository';
import { CONTENT_STATUSES } from '@/server/db/schema/content';
import { apiError, apiSuccess } from '@/lib/utils';

const BulkStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: z.enum(CONTENT_STATUSES),
});

// Admin-only, same rule as the single-question publish route: bulk status changes
// (including publish) from the question bank list are an admin action, not a teacher one.
export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = BulkStatusSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const editorId = isServiceKey ? null : session!.user.id;
  const updated = await questionRepository.setStatusMany(parsed.data.ids, parsed.data.status, editorId);
  return apiSuccess(updated);
}
