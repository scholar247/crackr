import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { isAdmin } from '@/lib/roles';
import { AddMemberSchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const community = await communityRepository.findById(id);
  if (!community) return apiError('Not found', 404);

  const visible = await communityRepository.canView(community, session!.user.id, session!.user.role, id);
  if (!visible) return apiError('Not found', 404);

  const members = await communityRepository.listMembers(id);
  return apiSuccess(members);
}

// MODERATOR+ only — the only way into a PRIVATE community (see community.repository.ts's
// addMember comment); also usable to top up a PUBLIC community's roster directly.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const membership = await communityRepository.getMembership(id, session!.user.id);
  if ((!membership || membership.role === 'MEMBER') && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  const parsed = AddMemberSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const target = await userRepository.findByEmail(parsed.data.email);
  if (!target) return apiError('No account found for that email', 404);

  try {
    await communityRepository.addMember(id, target.id);
    return apiSuccess({ added: true }, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not add member';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
