import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Author or MODERATOR+ — see community.repository.ts's removeComment.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { commentId } = await params;
  try {
    await communityRepository.removeComment(Number(commentId), session!.user.id, session!.user.role);
    return apiSuccess({ removed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not remove comment';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
