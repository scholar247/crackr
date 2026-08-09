import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { CompleteOnboardingSchema } from '@/schemas/onboarding.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = CompleteOnboardingSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { targetYear, level, primaryExamId, additionalExamIds } = parsed.data;

  // Re-validate exam ids server-side against the same active-exam set the picker was
  // built from — never trust that a client-supplied uuid is a real, still-active exam.
  const activeExamIds = new Set((await taxonomyRepository.listPublicExams()).map((row) => row.exam.id));
  const submittedIds = [primaryExamId, ...additionalExamIds];
  if (submittedIds.some((id) => !activeExamIds.has(id))) {
    return apiError('One or more selected exams are no longer available', 400);
  }

  await userRepository.completeOnboarding(session!.user.id, { targetYear, level, primaryExamId, additionalExamIds });
  return apiSuccess({ onboardingCompleted: true });
}
