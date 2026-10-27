import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { apiError, apiSuccess } from '@/lib/utils';

// Organizer/admin only — one participant's full attempt breakdown (summary stats, topic
// performance, question-by-question review). Reuses getAttemptState/getResultsSummary by
// passing the STUDENT's own userId through (not the viewer's) once the viewer's
// organizer/admin authorization has already been checked here — those two functions'
// internal "attempt.userId === userId" ownership check is satisfied without needing to
// touch their signatures or security model at all.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, userId } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  const attempt = await assessmentRepository.findLatestCompletedAttempt(id, userId);
  if (!attempt) return apiError('This participant has not completed an attempt', 404);

  const [state, summary] = await Promise.all([
    assessmentRepository.getAttemptState(id, attempt.id, userId),
    assessmentRepository.getResultsSummary(id, attempt.id, userId),
  ]);

  return apiSuccess({ state, summary });
}
