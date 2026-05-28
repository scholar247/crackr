import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { courseRepository } from '@/server/repositories/course.repository';

export async function GET() {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const teacherId = session!.user.id;
  const [allSessions, courses] = await Promise.all([
    liveSessionRepository.findByTeacher(teacherId),
    courseRepository.findAll({ teacherId }),
  ]);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  return apiSuccess({ sessions: allSessions, courseMap });
}
