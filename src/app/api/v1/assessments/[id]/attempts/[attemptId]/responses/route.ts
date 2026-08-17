import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { SaveResponseSchema } from '@/schemas/self-mock.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Upserts one question's answer — called on every option click / mark-for-review toggle
// from the exam room, not just on navigate, so a refresh or crash never loses progress.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id, attemptId } = await params;
  const parsed = SaveResponseSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    await assessmentRepository.saveResponse(id, attemptId, session!.user.id, parsed.data);
    return apiSuccess({ saved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save response';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
