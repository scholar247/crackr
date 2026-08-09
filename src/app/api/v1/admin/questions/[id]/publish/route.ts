import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { questionRepository } from '@/server/repositories/question.repository';
import { apiError, apiSuccess, parseContentId } from '@/lib/utils';

const PublishSchema = z.object({ publish: z.boolean() });

// Deliberately ADMIN, not TEACHER: questions are created as DRAFT by anyone who can
// author them, but only an admin promotes one to PUBLISHED (or pulls it back to DRAFT).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const questionId = parseContentId(id);
  if (questionId === null) return apiError('Not found', 404);

  const existing = await questionRepository.findById(questionId);
  if (!existing) return apiError('Not found', 404);

  const parsed = PublishSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const updated = await questionRepository.setPublishStatus(questionId, parsed.data.publish);
  return apiSuccess(updated);
}
