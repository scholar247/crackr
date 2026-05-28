import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseRepository } from '@/server/repositories/course.repository';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; userId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId, userId } = await params;
  const existing = await enrollmentRepository.findOne(courseId, userId);
  if (!existing) return apiError('Enrollment not found', 404);

  await enrollmentRepository.unenroll(courseId, userId);
  if (existing.status === 'ACTIVE') {
    await courseRepository.incrementEnrolledCount(courseId, -1);
  }

  return apiSuccess({ ok: true });
}
