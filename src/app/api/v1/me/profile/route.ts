import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { UpdateProfileSchema } from '@/schemas/profile.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// PATCH only — no GET here. The settings page fetches its initial data server-side via
// userRepository directly (same convention as every other page in this app), this route
// exists solely for the save mutation.
export async function PATCH(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = UpdateProfileSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { examIds, primaryExamId, targetProgramId } = parsed.data;

  // Never trust client-supplied uuids — same defensive re-validation as
  // /api/v1/me/onboarding, against the current active exam/program sets.
  if (examIds && examIds.length > 0) {
    const activeExamIds = new Set((await taxonomyRepository.listPublicExams()).map((row) => row.exam.id));
    const submittedIds = primaryExamId ? [primaryExamId, ...examIds] : examIds;
    if (submittedIds.some((id) => !activeExamIds.has(id))) {
      return apiError('One or more selected exams are no longer available', 400);
    }
  }
  if (targetProgramId) {
    const activeProgramIds = new Set((await taxonomyRepository.listPublicPrograms()).map((p) => p.id));
    if (!activeProgramIds.has(targetProgramId)) {
      return apiError('Selected program is no longer available', 400);
    }
  }

  const updated = await userRepository.updateProfile(session!.user.id, parsed.data);
  return apiSuccess(updated);
}
