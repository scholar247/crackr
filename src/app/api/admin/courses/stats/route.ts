import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const stats = await courseRepository.getStats();
  return apiSuccess(stats);
}
