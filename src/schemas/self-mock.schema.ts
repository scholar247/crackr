import { z } from 'zod';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';

export const AssessmentSectionSchema = z.object({
  title: z.string().min(1).max(160),
  // Null/omitted = pull from anywhere in the exam, not "no section."
  nodeId: z.uuid().optional(),
  questionCount: z.number().int().min(ASSESSMENT_LIMITS.MIN_QUESTIONS_PER_SECTION).max(ASSESSMENT_LIMITS.MAX_QUESTIONS_PER_SECTION),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  marks: z.number().min(0).max(ASSESSMENT_LIMITS.MAX_MARKS),
  negativeMarks: z.number().min(0).max(ASSESSMENT_LIMITS.MAX_MARKS),
});

export const CreateSelfMockSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().max(2000).optional(),
    examId: z.uuid(),
    sections: z.array(AssessmentSectionSchema).min(ASSESSMENT_LIMITS.MIN_SECTIONS).max(ASSESSMENT_LIMITS.MAX_SECTIONS),
    durationMinutes: z.number().int().min(ASSESSMENT_LIMITS.MIN_DURATION_MINUTES).max(ASSESSMENT_LIMITS.MAX_DURATION_MINUTES),
    // Unlimited by default for a self-mock — a student can retake their own config as
    // often as they like unless they explicitly cap it.
    maxAttempts: z.number().int().min(1).max(ASSESSMENT_LIMITS.MAX_ATTEMPTS_CAP).optional(),
  })
  .refine(
    (data) => {
      const total = data.sections.reduce((sum, s) => sum + s.questionCount, 0);
      return total >= ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS && total <= ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS;
    },
    { message: `Total questions across all sections must be between ${ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS} and ${ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS}` }
  );
export type CreateSelfMockInput = z.infer<typeof CreateSelfMockSchema>;

// Chosen right before an attempt starts, not at assessment-creation time — see
// assessment.repository.ts's countsTowardProgress comment.
export const StartAttemptSchema = z.object({
  countsTowardProgress: z.boolean().optional(),
});

export const SaveResponseSchema = z.object({
  questionId: z.number().int().positive(),
  selectedOptionKeys: z.array(z.string().min(1).max(4)).max(1).optional(),
  timeSpentSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
  markedForReview: z.boolean().optional(),
});
