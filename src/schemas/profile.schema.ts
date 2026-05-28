import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const UpdateProfileSchema = z
  .object({
    targetExamIds: z.array(z.string()).min(1, 'Select at least one exam'),
    primaryExamId: z.string().min(1, 'Select a primary exam'),
    preparationLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    targetYear: z
      .number()
      .int()
      .min(currentYear)
      .max(currentYear + 5)
      .optional(),
    preferredDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']),
    dailyGoalQuestions: z.number().int().min(5).max(200).default(20),
  })
  .refine((data) => data.targetExamIds.includes(data.primaryExamId), {
    message: 'Primary exam must be one of the selected exams',
    path: ['primaryExamId'],
  });

export const OnboardingStepOneSchema = z.object({
  targetExamIds: z.array(z.string()).min(1, 'Select at least one exam'),
  primaryExamId: z.string().min(1),
});

export const OnboardingStepTwoSchema = z.object({
  preparationLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  targetYear: z.number().int().optional(),
});

export const OnboardingStepThreeSchema = z.object({
  preferredDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']),
  dailyGoalQuestions: z.number().int().min(5).max(200),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type OnboardingStepOneInput = z.infer<typeof OnboardingStepOneSchema>;
export type OnboardingStepTwoInput = z.infer<typeof OnboardingStepTwoSchema>;
export type OnboardingStepThreeInput = z.infer<typeof OnboardingStepThreeSchema>;
