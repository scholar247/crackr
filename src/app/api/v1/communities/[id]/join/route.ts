import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { apiError, apiSuccess } from '@/lib/utils';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  try {
    await communityRepository.join(id, session!.user.id);
    return apiSuccess({ joined: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not join';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
