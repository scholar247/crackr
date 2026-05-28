import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { CreateLiveSessionSchema } from '@/schemas/course.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const sessions = await liveSessionRepository.findByCourse(courseId);
  return apiSuccess(sessions);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const body = await req.json();
  const parsed = CreateLiveSessionSchema.safeParse({ ...body, courseId });
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await liveSessionRepository.create(parsed.data);

  const allSessions = await liveSessionRepository.findByCourse(courseId);
  await courseRepository.updateStats(courseId, { totalLiveSessions: allSessions.length });

  return apiSuccess(session, undefined, 201);
}
