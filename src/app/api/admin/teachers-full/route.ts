import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';
import { courseRepository } from '@/server/repositories/course.repository';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const [teachers, allCourses] = await Promise.all([
    userRepository.findByRole('TEACHER'),
    courseRepository.findAll(),
  ]);

  const teacherData = teachers.map((t) => ({
    ...t,
    courseCount: allCourses.filter((c) => c.teacherIds.includes(t.id)).length,
    studentCount: allCourses
      .filter((c) => c.teacherIds.includes(t.id))
      .reduce((sum, c) => sum + c.enrolledCount, 0),
  }));

  return apiSuccess(teacherData);
}
