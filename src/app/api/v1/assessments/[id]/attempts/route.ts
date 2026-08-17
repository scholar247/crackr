import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { StartAttemptSchema } from '@/schemas/self-mock.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) return apiError('Not found', 404);

  const parsed = StartAttemptSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    const state = await assessmentRepository.startAttempt(id, session!.user.id, parsed.data);
    return apiSuccess(state, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start attempt';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
