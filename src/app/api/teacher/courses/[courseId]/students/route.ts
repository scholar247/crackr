import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { userRepository } from '@/server/repositories/user.repository';

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

  const enrollments = await enrollmentRepository.findByCourse(courseId);
  const userIds = enrollments.map((e) => e.userId);
  const users = userIds.length > 0 ? await userRepository.findByIds(userIds) : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const enriched = enrollments.map((e) => ({ ...e, user: userMap[e.userId] }));

  return apiSuccess({ courseTitle: course.title, enrollments: enriched });
}
