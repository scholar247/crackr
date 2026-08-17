import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { audienceRepository } from '@/server/repositories/audience.repository';
import { isAdmin } from '@/lib/roles';
import { AddInvitesSchema } from '@/schemas/group-test.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Organizer/admin only — invite more people into an existing group test.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  const parsed = AddInvitesSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const requestedEmails = Array.from(new Set((parsed.data.emails ?? []).map((e) => e.toLowerCase())));
  const matchedUsers = await userRepository.findManyByEmails(requestedEmails);
  const matchedEmailSet = new Set(matchedUsers.map((u) => u.email.toLowerCase()));
  const unmatchedEmails = requestedEmails.filter((e) => !matchedEmailSet.has(e));

  const requestedAudienceIds = Array.from(new Set(parsed.data.audienceIds ?? []));
  const validAudiences = await audienceRepository.findManyActiveByIds(requestedAudienceIds);
  if (validAudiences.length !== requestedAudienceIds.length) return apiError('Invalid group id', 400);

  await assessmentRepository.grantGroupTestAccess(id, session!.user.id, {
    matchedUserIds: matchedUsers.map((u) => u.id),
    unmatchedEmails,
    audienceIds: requestedAudienceIds,
  });

  return apiSuccess({ matched: matchedUsers.length, pending: unmatchedEmails.length, audiences: requestedAudienceIds.length });
}
