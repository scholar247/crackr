import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const users = await userRepository.listRecent(10);
  return apiSuccess(users);
}
