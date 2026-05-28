import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);

  const enrollment = await enrollmentRepository.findOne(courseId, session!.user.id);
  const isEnrolled = enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED';

  const [upcoming, past] = await Promise.all([
    liveSessionRepository.findUpcomingByCourse(courseId),
    liveSessionRepository.findPastByCourse(courseId),
  ]);

  const upcomingWithJoinUrl = upcoming.map((s) => ({
    ...s,
    joinUrl: isEnrolled ? liveSessionRepository.getVisibleJoinUrl(s) : null,
  }));

  return apiSuccess({ upcoming: upcomingWithJoinUrl, past });
}
