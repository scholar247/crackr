import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Resume state for the exam room — answers stripped while IN_PROGRESS. Ownership of the
// specific attempt is checked inside getAttemptState itself.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, attemptId } = await params;
  try {
    const state = await assessmentRepository.getAttemptState(id, attemptId, session!.user.id);
    return apiSuccess(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load attempt';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
