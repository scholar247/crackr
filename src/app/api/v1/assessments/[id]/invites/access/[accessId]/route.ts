import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { apiError, apiSuccess } from '@/lib/utils';

// Organizer/admin only — revoke one invited user's access, only before they've started.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; accessId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, accessId } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  try {
    await assessmentRepository.revokeAccess(id, accessId);
    return apiSuccess({ revoked: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not revoke access';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
