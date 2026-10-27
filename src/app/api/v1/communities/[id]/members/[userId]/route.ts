import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { UpdateMemberRoleSchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// OWNER-only promote/demote — enforced inside communityRepository.updateMemberRole.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, userId } = await params;
  const parsed = UpdateMemberRoleSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    await communityRepository.updateMemberRole(id, session!.user.id, session!.user.role, userId, parsed.data.role);
    return apiSuccess({ updated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update role';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, userId } = await params;
  try {
    await communityRepository.removeMember(id, session!.user.id, session!.user.role, userId);
    return apiSuccess({ removed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not remove member';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
