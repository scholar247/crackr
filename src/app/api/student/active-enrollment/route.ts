import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return apiSuccess({ courseId: null });

  try {
    const enrollments = await enrollmentRepository.findByUser(session!.user.id);
    const active = enrollments.find((e) => e.status === 'ACTIVE');
    return apiSuccess({ courseId: active?.courseId ?? null });
  } catch {
    return apiSuccess({ courseId: null });
  }
}
