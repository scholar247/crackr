import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { apiSuccess } from '@/lib/utils';

// Pending challenges where I'm the opponent — the "someone challenged you" notification feed.
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const rows = await assessmentRepository.listIncomingChallenges(session!.user.id);
  return apiSuccess(rows);
}
