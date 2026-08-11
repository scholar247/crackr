import { requireAuth } from '@/server/auth/require-auth';
import { questionRepository } from '@/server/repositories/question.repository';
import { UpdateQuestionSchema } from '@/schemas/question.schema';
import { isAdmin } from '@/lib/roles';
import { apiError, apiSuccess, parseContentId } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const { id } = await params;
  const questionId = parseContentId(id);
  if (questionId === null) return apiError('Not found', 404);

  const question = await questionRepository.findById(questionId);
  if (!question) return apiError('Not found', 404);

  return apiSuccess(question);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const { id } = await params;
  const questionId = parseContentId(id);
  if (questionId === null) return apiError('Not found', 404);

  const existing = await questionRepository.findById(questionId);
  if (!existing) return apiError('Not found', 404);

  // Teachers can only edit their own questions; admins (and the seed/API-key identity,
  // which is always ADMIN-level) can edit any — same rule as articles.
  if (!isAdmin(session!.user.role) && existing.authorId !== session!.user.id) {
    return apiError('Forbidden', 403);
  }

  const parsed = UpdateQuestionSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const editorId = isServiceKey ? null : session!.user.id;
  const updated = await questionRepository.update(questionId, parsed.data, editorId);
  return apiSuccess(updated);
}
