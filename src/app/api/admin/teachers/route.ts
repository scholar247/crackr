import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const teachers = await userRepository.findByRole('TEACHER');
  return apiSuccess(teachers);
}
