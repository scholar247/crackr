import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (!course.teacherIds.includes(session!.user.id) && session!.user.role === 'TEACHER') {
    return apiError('Forbidden', 403);
  }

  const allSessions = await liveSessionRepository.findByCourse(courseId);
  const sessions = session!.user.role === 'TEACHER'
    ? allSessions.filter((s) => s.teacherId === session!.user.id)
    : allSessions;

  return apiSuccess({ courseTitle: course.title, sessions, teacherId: session!.user.id });
}
