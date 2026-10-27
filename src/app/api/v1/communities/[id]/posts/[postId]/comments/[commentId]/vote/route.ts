import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const VoteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = VoteSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { commentId } = await params;
  try {
    const result = await communityRepository.voteOnComment(Number(commentId), session!.user.id, parsed.data.value);
    return apiSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not vote';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
