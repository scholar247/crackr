import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';
import {
  OnboardingStepOneSchema,
  OnboardingStepTwoSchema,
  OnboardingStepThreeSchema,
} from '@/schemas/profile.schema';
import { z } from 'zod';

const OnboardingBodySchema = z.discriminatedUnion('step', [
  z.object({ step: z.literal(1), data: OnboardingStepOneSchema }),
  z.object({ step: z.literal(2), data: OnboardingStepTwoSchema }),
  z.object({ step: z.literal(3), data: OnboardingStepThreeSchema }),
]);

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = OnboardingBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const userId = session!.user.id;
  const { step, data } = parsed.data;

  if (step === 1) {
    await userRepository.patchProfile(userId, {
      targetExamIds: data.targetExamIds,
      primaryExamId: data.primaryExamId,
      onboardingStep: 1,
    });
    return apiSuccess({ onboardingCompleted: false, nextStep: 2 });
  }

  if (step === 2) {
    await userRepository.patchProfile(userId, {
      preparationLevel: data.preparationLevel,
      targetYear: data.targetYear,
      onboardingStep: 2,
    });
    return apiSuccess({ onboardingCompleted: false, nextStep: 3 });
  }

  if (step === 3) {
    await userRepository.patchProfile(userId, {
      preferredDifficulty: data.preferredDifficulty,
      dailyGoalQuestions: data.dailyGoalQuestions,
      onboardingCompleted: true,
      onboardingStep: 3,
    });
    return apiSuccess({ onboardingCompleted: true, nextStep: null });
  }
}
