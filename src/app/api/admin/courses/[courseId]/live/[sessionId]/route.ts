import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { UpdateLiveSessionSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { sessionId } = await params;
  const body = await req.json();
  const parsed = UpdateLiveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await liveSessionRepository.update(sessionId, parsed.data);
  if (!session) return apiError('Session not found', 404);
  return apiSuccess(session);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { sessionId } = await params;
  const ok = await liveSessionRepository.delete(sessionId);
  if (!ok) return apiError('Session not found', 404);
  return apiSuccess({ ok: true });
}
