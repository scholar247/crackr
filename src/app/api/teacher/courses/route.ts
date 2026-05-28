import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';

export async function GET() {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const teacherId = session!.user.id;
  const courses = await courseRepository.findAll({ teacherId });
  const enrollmentCounts = await Promise.all(courses.map((c) => enrollmentRepository.countByCourse(c.id)));
  const courseData = courses.map((c, i) => ({ ...c, studentCount: enrollmentCounts[i] }));

  return apiSuccess(courseData);
}
