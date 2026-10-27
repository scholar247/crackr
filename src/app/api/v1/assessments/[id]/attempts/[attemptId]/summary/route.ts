import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Results-page data — 409s (ATTEMPT_IN_PROGRESS) if the attempt hasn't been submitted or
// lazily expired yet.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, attemptId } = await params;
  try {
    const summary = await assessmentRepository.getResultsSummary(id, attemptId, session!.user.id);
    return apiSuccess(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load summary';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
