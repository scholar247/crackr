import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { apiSuccess } from '@/lib/utils';

// My attempt history — the progress-tracker feed. ?countsTowardProgress=true to scope to
// only attempts the user chose to track (vs. practice-only runs).
export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const countsParam = searchParams.get('countsTowardProgress');
  const countsTowardProgress = countsParam === 'true' ? true : countsParam === 'false' ? false : undefined;

  const rows = await assessmentRepository.listMyAttempts(session!.user.id, { countsTowardProgress });
  return apiSuccess(rows);
}
