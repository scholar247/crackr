import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (course.status !== 'PUBLISHED') return apiError('Course is not available for enrollment', 400);

  // TODO: PAYMENT INTEGRATION — check payment for isSubscriptionRequired courses

  const enrollment = await enrollmentRepository.enroll(courseId, session!.user.id);

  const existing = await enrollmentRepository.findOne(courseId, session!.user.id);
  if (!existing) {
    await courseRepository.incrementEnrolledCount(courseId, 1);
  }

  return apiSuccess(enrollment, undefined, 201);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;
  await enrollmentRepository.unenroll(courseId, session!.user.id);
  await courseRepository.incrementEnrolledCount(courseId, -1);
  return apiSuccess({ ok: true });
}
