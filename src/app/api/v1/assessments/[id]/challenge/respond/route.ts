import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { RespondChallengeSchema } from '@/schemas/challenge.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Opponent only — accept or decline a pending challenge.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const parsed = RespondChallengeSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    const challenge = await assessmentRepository.respondToChallenge(id, session!.user.id, parsed.data.accept);
    return apiSuccess(challenge);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not respond to challenge';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
