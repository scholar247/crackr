import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const PinSchema = z.object({ pinned: z.boolean() });

// MODERATOR+ only — enforced in community.repository.ts's setPinned.
export async function POST(req: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { postId } = await params;
  const parsed = PinSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    await communityRepository.setPinned(Number(postId), session!.user.id, session!.user.role, parsed.data.pinned);
    return apiSuccess({ pinned: parsed.data.pinned });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update pin state';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
