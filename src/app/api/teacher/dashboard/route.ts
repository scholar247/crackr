import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';

export async function GET() {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const teacherId = session!.user.id;
  const [myCourses, upcomingSessions] = await Promise.all([
    courseRepository.findAll({ teacherId }),
    liveSessionRepository.findByTeacher(teacherId),
  ]);

  const publishedCourses = myCourses.filter((c) => c.status === 'PUBLISHED');
  const enrollmentCounts = await Promise.all(publishedCourses.map((c) => enrollmentRepository.countByCourse(c.id)));
  const courseStats = publishedCourses.map((c, i) => ({ ...c, studentCount: enrollmentCounts[i] }));

  const now = new Date();
  const upcoming = upcomingSessions
    .filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE')
    .filter((s) => new Date(s.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const liveNow = upcomingSessions.filter((s) => s.status === 'LIVE');
  const totalStudents = enrollmentCounts.reduce((a, b) => a + b, 0);
  const totalSessions = upcomingSessions.filter((s) => s.status === 'COMPLETED').length;

  return apiSuccess({
    courses: courseStats,
    upcomingSessions: upcoming,
    liveNow,
    stats: { totalStudents, totalCourses: publishedCourses.length, totalSessions },
  });
}
