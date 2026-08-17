import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Either party (or admin) — head-to-head comparison, "pending" (championUserId null)
// until both attempts are complete.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  try {
    const comparison = await assessmentRepository.getChallengeComparison(id, session!.user.id);
    return apiSuccess(comparison);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load comparison';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
