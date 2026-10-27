import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Either party — locks the shared start moment once (idempotent, race-safe; see
// assessment.repository.ts's startChallenge). Both players then start their own attempt
// via POST /attempts, whose deadline is computed from this same assessments.startsAt.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  try {
    const assessment = await assessmentRepository.startChallenge(id, session!.user.id);
    return apiSuccess(assessment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start challenge';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
