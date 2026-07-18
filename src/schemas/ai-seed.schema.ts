import { z } from 'zod';
import { BlogTypeSchema } from './blog.schema';
import { DifficultySchema } from './index';

export const SeedKindSchema = z.enum(['BLOG', 'MCQ']);
export const SeedStatusSchema = z.enum(['PENDING', 'GENERATING', 'DONE', 'FAILED']);

// ─── Planner input (admin "Create Seeds" form) ───────────────────────────────

export const PlanSeedsSchema = z
  .object({
    examId: z.string().min(1, 'Exam is required'),
    subjectId: z.string().min(1, 'Subject is required'),
    topicIds: z.array(z.string().min(1)).min(1, 'At least one topic is required'),

    articleTypes: z.array(BlogTypeSchema).default([]),
    minBlogSeeds: z.coerce.number().int().min(0).default(1),
    maxBlogSeeds: z.coerce.number().int().min(0).default(3),

    minMcqSets: z.coerce.number().int().min(0).default(1),
    maxMcqSets: z.coerce.number().int().min(0).default(3),
    mcqsPerSet: z.coerce.number().int().min(1).max(50).default(10),
    difficultyMix: z.record(DifficultySchema, z.number().min(0).max(1)).default({
      EASY: 0.3,
      MEDIUM: 0.4,
      HARD: 0.2,
      EXPERT: 0.1,
    }),
    includePYQ: z.boolean().default(false),
    autoCreateSubtopics: z.boolean().default(false),
  })
  .refine((d) => d.maxBlogSeeds >= d.minBlogSeeds, {
    message: 'maxBlogSeeds must be >= minBlogSeeds',
    path: ['maxBlogSeeds'],
  })
  .refine((d) => d.maxMcqSets >= d.minMcqSets, {
    message: 'maxMcqSets must be >= minMcqSets',
    path: ['maxMcqSets'],
  });

export type PlanSeedsInput = z.infer<typeof PlanSeedsSchema>;

// ─── List query (Seed Monitor) ───────────────────────────────────────────────

export const SeedListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  kind: SeedKindSchema.optional(),
  status: SeedStatusSchema.optional(),
  planRunId: z.string().optional(),
});

export type SeedListQuery = z.infer<typeof SeedListQuerySchema>;
