import { z } from 'zod';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_STATUSES } from '@/lib/notifications';
import { findUnsafeMarkdownContent } from '@/lib/markdown-safety';
import { slugify } from '@/lib/utils';

// Admin create/edit payload. The form always submits the full record (like sample papers);
// quick toggles (publish, important) use NotificationPatchSchema instead.
export const NotificationSchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
    // Optional: derived from the title when blank. Must slugify to itself so the URL is clean.
    slug: z
      .string()
      .trim()
      .max(220)
      .refine((v) => v === '' || slugify(v) === v, 'Slug may only contain lowercase letters, numbers and hyphens')
      .optional(),
    summary: z.string().trim().min(10, 'Summary must be at least 10 characters').max(500),
    content: z
      .string()
      .trim()
      .min(1, 'Content is required')
      .max(60_000)
      .superRefine((v, ctx) => {
        for (const message of findUnsafeMarkdownContent(v)) ctx.addIssue({ code: 'custom', message });
      }),
    category: z.enum(NOTIFICATION_CATEGORIES),
    status: z.enum(NOTIFICATION_STATUSES),
    isImportant: z.boolean(),
    sourceUrl: z
      .string()
      .trim()
      .max(2048)
      .refine((v) => /^https?:\/\/[^\s]+$/i.test(v), 'Source must be an http(s):// link')
      .nullish()
      .or(z.literal('')),
    // ISO string; null/omitted = "now" when published, unset while a draft.
    publishedAt: z.iso.datetime({ offset: true }).nullish(),
    examIds: z.array(z.string().min(1).max(36)).min(1, 'Choose at least one exam').max(20),
  })
  .strict();

export type NotificationInput = z.infer<typeof NotificationSchema>;

export const NotificationPatchSchema = z
  .object({
    status: z.enum(NOTIFICATION_STATUSES),
    isImportant: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export type NotificationPatch = z.infer<typeof NotificationPatchSchema>;

export const AdminNotificationQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  examId: z.string().max(36).optional(),
  important: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
