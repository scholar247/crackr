import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { GoLiveSchema } from '@/schemas/course.schema';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { sessionId } = await params;
  const existing = await liveSessionRepository.findById(sessionId);
  if (!existing) return apiError('Session not found', 404);
  if (existing.teacherId !== session!.user.id) return apiError('Not authorized', 403);

  const body = await req.json();
  const parsed = GoLiveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await liveSessionRepository.goLive(sessionId, parsed.data);
  return apiSuccess(updated);
}
