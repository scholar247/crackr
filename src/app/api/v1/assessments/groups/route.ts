import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, AssessmentValidationError } from '@/server/repositories/assessment.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { audienceRepository } from '@/server/repositories/audience.repository';
import { CreateGroupTestSchema } from '@/schemas/group-test.schema';
import { apiError, apiSuccess } from '@/lib/utils';
import { canInviteAudience } from '@/lib/roles';

// Any signed-in user can organize a group test — same permissive creator model as
// self-mocks and challenges (see the plan's "any signed-in user" decision). Assigning by
// user group (audience) is teacher/admin-only though — students only get email invites.
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = CreateGroupTestSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  const input = parsed.data;

  if ((input.audienceIds?.length ?? 0) > 0 && !canInviteAudience(session!.user.role)) {
    return apiError('Only teachers and admins can invite by group', 403);
  }

  const exam = await taxonomyRepository.findExamById(input.examId);
  if (!exam || exam.status !== 'ACTIVE') return apiError('Invalid exam', 400);

  const sectionNodeIds = input.sections.map((s) => s.nodeId).filter((id): id is string => Boolean(id));
  if (sectionNodeIds.length > 0) {
    const validNodeIds = await taxonomyRepository.listNodes().then((rows) => new Set(rows.map((n) => n.id)));
    const invalidNode = sectionNodeIds.find((id) => !validNodeIds.has(id));
    if (invalidNode) return apiError(`Invalid node id: ${invalidNode}`, 400);
  }

  // Resolve invites: existing accounts get immediate access, everyone else becomes a
  // pending invite auto-claimed if/when they sign up (userRepository.provisionGoogleUser).
  const requestedEmails = Array.from(new Set((input.emails ?? []).map((e) => e.toLowerCase())));
  const matchedUsers = await userRepository.findManyByEmails(requestedEmails);
  const matchedEmailSet = new Set(matchedUsers.map((u) => u.email.toLowerCase()));
  const unmatchedEmails = requestedEmails.filter((e) => !matchedEmailSet.has(e));

  const requestedAudienceIds = Array.from(new Set(input.audienceIds ?? []));
  const validAudiences = await audienceRepository.findManyActiveByIds(requestedAudienceIds);
  if (validAudiences.length !== requestedAudienceIds.length) {
    const validIds = new Set(validAudiences.map((a) => a.id));
    const invalidId = requestedAudienceIds.find((id) => !validIds.has(id));
    return apiError(`Invalid group id: ${invalidId}`, 400);
  }

  try {
    const created = await assessmentRepository.createGroupTest({
      title: input.title,
      description: input.description,
      examId: input.examId,
      sections: input.sections,
      durationSeconds: input.durationMinutes * 60,
      maxAttempts: input.maxAttempts ?? null,
      schedulingMode: input.schedulingMode,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      organizerUserId: session!.user.id,
      invite: { matchedUserIds: matchedUsers.map((u) => u.id), unmatchedEmails, audienceIds: requestedAudienceIds },
      studentInstructions: input.studentInstructions,
      tags: input.tags,
      bannerImage: input.bannerImage,
    });
    return apiSuccess(
      { ...created, inviteReport: { matched: matchedUsers.length, pending: unmatchedEmails.length, audiences: requestedAudienceIds.length } },
      undefined,
      201
    );
  } catch (err) {
    if (err instanceof AssessmentValidationError) {
      const detail = err.issues.map((i) => `"${i.section}": requested ${i.requested}, only ${i.available} published`).join('; ');
      return apiError(`${err.message} — ${detail}`, 400);
    }
    throw err;
  }
}
