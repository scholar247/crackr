import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;

  let myCourses: Array<{ id: string; title: string; thumbnailUrl?: string; progress: number; lastLessonId?: string }> = [];
  let upcomingLiveSessions: Array<{ id: string; title: string; courseTitle: string; scheduledAt: string; joinUrl?: string | null; status: string; courseId: string }> = [];
  let nimcetExamId: string | null = null;

  try {
    const enrollments = await enrollmentRepository.findByUser(userId);
    if (enrollments.length > 0) {
      const courseIds = enrollments.map((e) => e.courseId);
      const courses = await Promise.all(courseIds.map((id) => courseRepository.findById(id)));
      myCourses = enrollments
        .map((e) => {
          const c = courses.find((c) => c?.id === e.courseId);
          if (!c) return null;
          return { id: c.id, title: c.title, thumbnailUrl: c.thumbnailUrl, progress: e.progress, lastLessonId: e.lastLessonId };
        })
        .filter(Boolean) as typeof myCourses;

      const liveSessions = await liveSessionRepository.findUpcomingForCourses(courseIds);
      upcomingLiveSessions = liveSessions.slice(0, 3).map((s) => {
        const c = courses.find((c) => c?.id === s.courseId);
        return {
          id: s.id,
          title: s.title,
          courseTitle: c?.title ?? 'Course',
          scheduledAt: s.scheduledAt,
          joinUrl: s.status === 'LIVE' ? s.joinUrl : null,
          status: s.status,
          courseId: s.courseId,
        };
      });
    }
  } catch { /* ok */ }

  try {
    const user = await userRepository.findById(userId);
    const nimcet = await examRepository.findBySlug('nimcet');
    nimcetExamId = nimcet?.id ?? null;
    void user;
  } catch { /* ok */ }

  return apiSuccess({ myCourses, upcomingLiveSessions, nimcetExamId });
}
