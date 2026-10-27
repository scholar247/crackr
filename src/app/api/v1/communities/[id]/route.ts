import { requireAuth, optionalAuth } from '@/server/auth/require-auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { isAdmin } from '@/lib/roles';
import { UpdateCommunitySchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Read-only — answers PUBLIC data to anonymous callers (see optionalAuth).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await optionalAuth();

  const { id } = await params;
  const community = await communityRepository.findById(id);
  if (!community) return apiError('Not found', 404);

  const visible = await communityRepository.canView(community, userId, role, id);
  if (!visible) return apiError('Not found', 404); // PRIVATE non-members get 404, not 403 — don't leak existence

  const myMembership = userId ? await communityRepository.getMembership(id, userId) : null;
  return apiSuccess({ ...community, myRole: myMembership?.role ?? null });
}

// OWNER or platform admin only.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const community = await communityRepository.findById(id);
  if (!community) return apiError('Not found', 404);

  const membership = await communityRepository.getMembership(id, session!.user.id);
  if (membership?.role !== 'OWNER' && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  const parsed = UpdateCommunitySchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const updated = await communityRepository.updateCommunity(id, parsed.data);
  return apiSuccess(updated);
}

// Archive, not delete — preserves post/comment history for members who were there.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const community = await communityRepository.findById(id);
  if (!community) return apiError('Not found', 404);

  const membership = await communityRepository.getMembership(id, session!.user.id);
  if (membership?.role !== 'OWNER' && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  await communityRepository.archiveCommunity(id);
  return apiSuccess({ archived: true });
}
