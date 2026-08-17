import { requireAuth, optionalAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { CreatePostSchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Read-only — answers PUBLIC data to anonymous callers (see optionalAuth).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { userId, role } = await optionalAuth();

  const { id, postId } = await params;
  const post = await communityRepository.getPost(Number(postId));
  if (!post || post.communityId !== id) return apiError('Not found', 404);

  const community = await communityRepository.findById(id);
  if (!community || !(await communityRepository.canView(community, userId, role, id))) {
    return apiError('Not found', 404);
  }

  const votes = await communityRepository.userVotes(userId, 'POST', [post.id]);
  return apiSuccess({ ...post, myVote: votes.get(post.id) ?? null });
}

// Author-only edit.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { postId } = await params;
  const parsed = CreatePostSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    const post = await communityRepository.updatePost(Number(postId), session!.user.id, parsed.data);
    return apiSuccess(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update post';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}

// Author or MODERATOR+ — soft delete, see community.repository.ts's removePost.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { postId } = await params;
  try {
    await communityRepository.removePost(Number(postId), session!.user.id, session!.user.role);
    return apiSuccess({ removed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not remove post';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
