import { z } from 'zod';
import { MIND_MAP_ACTIONS, MIND_MAP_LIMITS, MIND_MAP_STATUSES } from '@/lib/mind-maps';
import { findUnsafeMarkdownContent } from '@/lib/markdown-safety';

const safeMarkdown = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .superRefine((v, ctx) => {
      for (const message of findUnsafeMarkdownContent(v)) ctx.addIssue({ code: 'custom', message });
    });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const CreateMindMapSchema = z
  .object({
    examId: z.string().min(1).max(36),
    chapterNodeId: z.string().min(1).max(36),
  })
  .strict();

const NodeSchema = z
  .object({
    id: z.uuid(),
    parentId: z.uuid().nullable(),
    curriculumNodeId: z.string().max(36).nullable(),
    label: z.string().trim().min(1, 'Every node needs a label').max(MIND_MAP_LIMITS.label),
    description: optionalText(MIND_MAP_LIMITS.description),
    content: safeMarkdown(MIND_MAP_LIMITS.content)
      .nullish()
      .transform((v) => (v ? v : null)),
    displayOrder: z.number().int().min(0).max(10_000),
  })
  .strict();

/** The editor always saves the whole draft. Tree structure is checked by validateFlatTree. */
export const SaveMindMapSchema = z
  .object({
    seoTitle: optionalText(200),
    seoDescription: optionalText(320),
    intro: optionalText(2_000),
    revisionNotes: safeMarkdown(20_000)
      .nullish()
      .transform((v) => (v ? v : null)),
    faqs: z
      .array(z.object({ question: z.string().trim().min(5).max(300), answer: z.string().trim().min(5).max(2_000) }).strict())
      .max(20),
    nodes: z.array(NodeSchema).max(MIND_MAP_LIMITS.maxNodes),
  })
  .strict();

export type SaveMindMapInput = z.infer<typeof SaveMindMapSchema>;

export const MindMapActionSchema = z.object({ action: z.enum(MIND_MAP_ACTIONS) }).strict();

export const AdminMindMapQuerySchema = z.object({
  examId: z.string().max(36).optional(),
  status: z.enum(MIND_MAP_STATUSES).optional(),
});
