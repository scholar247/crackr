import { z } from 'zod';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';
import { AssessmentSectionSchema } from './self-mock.schema';

export const CreateChallengeSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().max(2000).optional(),
    examId: z.uuid(),
    sections: z.array(AssessmentSectionSchema).min(ASSESSMENT_LIMITS.MIN_SECTIONS).max(ASSESSMENT_LIMITS.MAX_SECTIONS),
    durationMinutes: z.number().int().min(ASSESSMENT_LIMITS.MIN_DURATION_MINUTES).max(ASSESSMENT_LIMITS.MAX_DURATION_MINUTES),
    opponentEmail: z.email(),
  })
  .refine(
    (data) => {
      const total = data.sections.reduce((sum, s) => sum + s.questionCount, 0);
      return total >= ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS && total <= ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS;
    },
    { message: `Total questions across all sections must be between ${ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS} and ${ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS}` }
  );
export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;

export const RespondChallengeSchema = z.object({
  accept: z.boolean(),
});
