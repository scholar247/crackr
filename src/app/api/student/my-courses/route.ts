import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseRepository } from '@/server/repositories/course.repository';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const enrollments = await enrollmentRepository.findByUser(session!.user.id);
  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE');

  if (activeEnrollments.length === 0) return apiSuccess([]);

  const courseIds = activeEnrollments.map((e) => e.courseId);
  const courseResults = await Promise.allSettled(courseIds.map((id) => courseRepository.findById(id)));
  const courses = courseResults
    .flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []))
    .map((course) => ({
      ...course,
      enrollment: activeEnrollments.find((e) => e.courseId === course.id),
      isLive: false,
      progress: activeEnrollments.find((e) => e.courseId === course.id)?.progress ?? 0,
    }));

  return apiSuccess(courses);
}
