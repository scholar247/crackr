import { z } from 'zod';

export const ARTICLE_STATUS_VALUES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export const ARTICLE_VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'AUDIENCE_RESTRICTED'] as const;

export const CreateArticleSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(160).optional(),
  summary: z.string().max(500).optional(),
  body: z.string().max(200_000).default(''),
  status: z.enum(ARTICLE_STATUS_VALUES).default('DRAFT'),
  visibility: z.enum(ARTICLE_VISIBILITY_VALUES).default('PRIVATE'),
});
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = CreateArticleSchema.partial();
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
