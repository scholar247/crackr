import { requireAuth, optionalAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { CreateCommentSchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Read-only — answers PUBLIC data to anonymous callers (see optionalAuth).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { userId, role } = await optionalAuth();

  const { id, postId } = await params;
  const community = await communityRepository.findById(id);
  if (!community || !(await communityRepository.canView(community, userId, role, id))) {
    return apiError('Not found', 404);
  }

  const comments = await communityRepository.listComments(Number(postId));
  const [votes, scores] = await Promise.all([
    communityRepository.userVotes(
      userId,
      'COMMENT',
      comments.map((c) => c.id),
    ),
    communityRepository.commentScores(comments.map((c) => c.id)),
  ]);

  return apiSuccess(comments.map((c) => ({ ...c, myVote: votes.get(c.id) ?? null, score: scores.get(c.id) ?? 0 })));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { postId } = await params;
  const parsed = CreateCommentSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    const comment = await communityRepository.createComment(Number(postId), session!.user.id, parsed.data);
    return apiSuccess(comment, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not comment';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
