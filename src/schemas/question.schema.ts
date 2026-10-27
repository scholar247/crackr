import { z } from 'zod';
import { CONTENT_STATUSES } from '@/server/db/schema/content';

const QuestionOptionSchema = z.object({
  key: z.string().min(1).max(4),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const OptionsSchema = z
  .array(QuestionOptionSchema)
  .min(2)
  .max(6)
  .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
    message: 'Exactly one option must be marked correct',
  });

export const CreateQuestionSchema = z.object({
  stem: z.string().min(1).max(10_000),
  options: OptionsSchema,
  explanation: z.string().max(10_000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  // Deepest/most-specific curriculum node this question belongs to (e.g. a Topic or
  // Subtopic) — the repository derives and tags every ancestor (Chapter, Subject, ...)
  // automatically, so callers only ever pick the one leaf node.
  nodeId: z.uuid().optional(),
  examIds: z.array(z.uuid()).min(1, 'Select at least one exam'),
});
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = CreateQuestionSchema.partial().extend({
  status: z.enum(CONTENT_STATUSES).optional(),
});
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

// Bulk import — unlike CreateQuestionSchema's single `nodeId` (one leaf node, ancestors
// inferred), each item here can list *multiple* explicit nodes to map the question to
// directly (e.g. tag one question to both "Probability" and "Permutations"). `status`
// lets a trusted bulk import (e.g. the service-key path) publish straight away instead
// of always landing in DRAFT.
const BulkQuestionItemSchema = z.object({
  stem: z.string().min(1).max(10_000),
  options: OptionsSchema,
  explanation: z.string().max(10_000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  nodeIds: z.array(z.uuid()).max(20).optional(),
  examIds: z.array(z.uuid()).min(1, 'Select at least one exam'),
  status: z.enum(CONTENT_STATUSES).optional(),
});

export const BulkCreateQuestionSchema = z.array(BulkQuestionItemSchema).min(1).max(100);
export type BulkCreateQuestionInput = z.infer<typeof BulkCreateQuestionSchema>;
