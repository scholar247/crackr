import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) return apiError('Not found', 404);

  const detail = await assessmentRepository.findByIdWithSections(id);
  if (!detail) return apiError('Not found', 404);

  return apiSuccess(detail);
}

// Creator/admin only. Hard-deletes if nothing has attempted it yet; otherwise archives
// (never destroys real participant history on a shared group test).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);

  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) {
    return apiError('Forbidden', 403);
  }

  const result = await assessmentRepository.deleteOrArchive(id);
  return apiSuccess(result);
}
