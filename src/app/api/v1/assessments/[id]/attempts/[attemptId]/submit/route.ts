import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Idempotent — a double-click or a race with the lazy-expiry check just returns the
// already-final summary instead of erroring (see assessment.repository.ts's submitAttempt).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, attemptId } = await params;
  try {
    const result = await assessmentRepository.submitAttempt(id, attemptId, session!.user.id);
    return apiSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not submit attempt';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
