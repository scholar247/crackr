import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const [course, sessions, teachers] = await Promise.all([
    courseRepository.findById(courseId),
    liveSessionRepository.findByCourse(courseId),
    userRepository.findByRole('TEACHER'),
  ]);
  if (!course) return apiError('Course not found', 404);

  return apiSuccess({ course, sessions, teachers });
}
