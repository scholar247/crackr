import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { apiSuccess } from '@/lib/utils';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await communityRepository.markNotificationRead(Number(id), session!.user.id);
  return apiSuccess({ read: true });
}
