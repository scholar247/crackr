import { z } from 'zod';
import { MEDIA_CONTENT_LINK } from '@/lib/sample-papers';
import { slugify } from '@/lib/utils';

// An uploaded media file or an absolute http(s) URL — nothing else (no javascript:, no
// arbitrary relative paths the file proxy would have to make sense of).
const pdfLink = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => MEDIA_CONTENT_LINK.test(v) || /^https?:\/\/[^\s]+$/i.test(v), 'Upload a PDF or paste an http(s):// link');

export const SamplePaperSchema = z.object({
  examId: z.string().min(1, 'Choose an exam').max(36),
  year: z.number().int().min(2000).max(2100),
  // The URL slug is derived from the subject (ASCII only), so it needs Latin letters:
  // "Hindi Course A" rather than "हिंदी".
  subject: z
    .string()
    .trim()
    .min(2, 'Subject is required')
    .max(120)
    .refine((v) => slugify(v).length > 0, 'Write the subject in English letters (e.g. "Hindi Course A") — it becomes the page URL'),
  samplePaperLink: pdfLink,
  markingSchemeLink: pdfLink.nullish(),
  isPublished: z.boolean(),
});

export type SamplePaperInput = z.infer<typeof SamplePaperSchema>;
