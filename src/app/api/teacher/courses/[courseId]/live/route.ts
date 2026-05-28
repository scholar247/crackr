import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { CreateLiveSessionSchema } from '@/schemas/course.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId } = await params;
  const allSessions = await liveSessionRepository.findByCourse(courseId);
  // Teachers only see their own sessions
  const sessions = allSessions.filter((s) => s.teacherId === session!.user.id);
  return apiSuccess(sessions);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (!course.teacherIds.includes(session!.user.id)) return apiError('Not authorized for this course', 403);

  const body = await req.json();
  const parsed = CreateLiveSessionSchema.safeParse({ ...body, courseId, teacherId: session!.user.id });
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const liveSession = await liveSessionRepository.create(parsed.data);
  return apiSuccess(liveSession, undefined, 201);
}
