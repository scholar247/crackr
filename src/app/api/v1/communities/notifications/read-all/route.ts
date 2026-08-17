import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { apiSuccess } from '@/lib/utils';

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await communityRepository.markAllNotificationsRead(session!.user.id);
  return apiSuccess({ read: true });
}
