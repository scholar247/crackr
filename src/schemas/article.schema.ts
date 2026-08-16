import { z } from 'zod';

export const ARTICLE_STATUS_VALUES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export const ARTICLE_VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'AUDIENCE_RESTRICTED'] as const;
// COURSE_CONTENT is for syllabus-organized (subject/chapter/topic) book-style writeups,
// as opposed to a one-off CONCEPT/SOLUTION/TIPS_AND_TRICKS/FORMULA/NEWS post.
export const ARTICLE_TYPE_VALUES = ['GENERAL', 'CONCEPT', 'SOLUTION', 'TIPS_AND_TRICKS', 'FORMULA', 'NEWS', 'COURSE_CONTENT'] as const;

export const CreateArticleSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(160).optional(),
  summary: z.string().max(500).optional(),
  body: z.string().max(200_000).default(''),
  status: z.enum(ARTICLE_STATUS_VALUES).default('DRAFT'),
  visibility: z.enum(ARTICLE_VISIBILITY_VALUES).default('PRIVATE'),
  articleType: z.enum(ARTICLE_TYPE_VALUES).default('GENERAL'),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  keywords: z.array(z.string().max(60)).max(20).optional(),
  // Empty-string is accepted (and normalized to undefined) so the form can send a
  // just-cleared field without failing the url() check.
  ogImage: z
    .union([z.string().url().max(2048), z.literal('')])
    .optional()
    .transform((v) => v || undefined),
  // Curriculum tag — same "single leaf, ancestors auto-tagged" convention as
  // CreateQuestionSchema.nodeId. Drives concept-check/suggested-article matching on the
  // public blog detail page.
  nodeId: z.uuid().optional(),
});
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = CreateArticleSchema.partial();
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
