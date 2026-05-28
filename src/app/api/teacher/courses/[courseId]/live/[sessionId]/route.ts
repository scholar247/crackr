import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { UpdateLiveSessionSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { sessionId } = await params;
  const existing = await liveSessionRepository.findById(sessionId);
  if (!existing) return apiError('Session not found', 404);
  if (existing.teacherId !== session!.user.id && session!.user.role === 'TEACHER') {
    return apiError('Not authorized', 403);
  }

  const body = await req.json();
  const parsed = UpdateLiveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await liveSessionRepository.update(sessionId, parsed.data);
  return apiSuccess(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { sessionId } = await params;
  const existing = await liveSessionRepository.findById(sessionId);
  if (!existing) return apiError('Session not found', 404);
  if (existing.teacherId !== session!.user.id && session!.user.role === 'TEACHER') {
    return apiError('Not authorized', 403);
  }

  await liveSessionRepository.delete(sessionId);
  return apiSuccess({ deleted: true });
}
