import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const BlogStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SEEDING']);
export const BlogTypeSchema = z.enum([
  'THEORY',
  'QUICK_LEARN',
  'SHORT_NOTE',
  'FORMULA_SHEET',
  'REVISION_NOTE',
  'FAQ',
  'TRICKS',
  'CHEAT_SHEET',
]);

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const BlogSEOSchema = z.object({
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  keywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogTitle: z.string().max(160).optional(),
  ogDescription: z.string().max(320).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
  twitterTitle: z.string().max(160).optional(),
  twitterDescription: z.string().max(320).optional(),
  twitterImage: z.string().url().optional().or(z.literal('')),
  robots: z.string().max(100).optional(),
  schemaType: z.string().max(50).optional(),
});

// ─── AI Content Factory traceability ─────────────────────────────────────────

export const AIGenerationMetaSchema = z.object({
  seedId: z.string(),
  provider: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  generatedAt: z.string(),
  lockedAt: z.string().optional(),
  qaReport: z.record(z.string(), z.union([z.number(), z.array(z.string()), z.string()])).optional(),
});

// ─── Create / Update ──────────────────────────────────────────────────────────

export const CreateBlogSchema = z.object({
  type: BlogTypeSchema,
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  summary: z.string().max(500).default(''),
  content: z.string().default(''),
  examIds: z.array(z.string()).default([]),
  subjectIds: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
  relatedBlogIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  featuredImage: z.string().url().optional().or(z.literal('')),
  thumbnail: z.string().url().optional().or(z.literal('')),
  seo: BlogSEOSchema.default({}),
  status: BlogStatusSchema.default('DRAFT'),
  aiMeta: AIGenerationMetaSchema.optional(),
});

export const UpdateBlogSchema = CreateBlogSchema.partial();

// ─── List query ───────────────────────────────────────────────────────────────

export const BlogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: BlogStatusSchema.optional(),
  type: BlogTypeSchema.optional(),
  examIds: z.string().optional(),      // comma-separated
  subjectIds: z.string().optional(),   // comma-separated
  topicIds: z.string().optional(),     // comma-separated
  search: z.string().optional(),
  creatorEmail: z.string().optional(),
  sortBy: z.enum(['createdAt', 'publishedAt', 'viewCount', 'readingTimeMinutes']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
export type BlogListQuery = z.infer<typeof BlogListQuerySchema>;
export type BlogStatus = z.infer<typeof BlogStatusSchema>;
export type BlogType = z.infer<typeof BlogTypeSchema>;
