import { z } from 'zod';
import { PREP_LEVELS } from '@/lib/prep-level';

const currentYear = new Date().getFullYear();

export const CompleteOnboardingSchema = z.object({
  targetYear: z.number().int().min(currentYear).max(currentYear + 5),
  level: z.enum(PREP_LEVELS),
  primaryExamId: z.uuid(),
  // Primary is sent separately and may also appear here from the client's selection
  // state — the repository dedupes, so no need to enforce exclusivity here.
  additionalExamIds: z.array(z.uuid()).max(20).default([]),
});
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;
