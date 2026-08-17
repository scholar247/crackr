import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { apiError, apiSuccess } from '@/lib/utils';

// Organizer/admin only roster — never exposed to participants themselves (they'd see
// every other invitee's email otherwise).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  const roster = await assessmentRepository.listParticipants(id);
  return apiSuccess(roster);
}
