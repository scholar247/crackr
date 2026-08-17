import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const rows = await communityRepository.listMine(session!.user.id);
  return apiSuccess(rows);
}
