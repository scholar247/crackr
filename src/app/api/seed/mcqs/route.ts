import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { mcqService } from '@/server/services/mcq.service';
import { DifficultySchema, QuestionTypeSchema, ContentBlockTypeSchema } from '@/schemas';
import type { ContentBlock } from '@/types';

// ─── Content helpers ──────────────────────────────────────────────────────────

const RichBlockSchema = z.object({
  type: ContentBlockTypeSchema,
  content: z.string().min(1),
  altText: z.string().optional(),
});

// Accept either a plain string (→ TEXT block) or an array of rich blocks
const ContentInput = z.union([
  z.string().min(1),
  z.array(RichBlockSchema).min(1),
]);

function toBlocks(input: z.infer<typeof ContentInput>): ContentBlock[] {
  if (typeof input === 'string') return [{ type: 'TEXT', content: input }];
  return input as ContentBlock[];
}

// ─── Option schema ────────────────────────────────────────────────────────────

const OptionSchema = z.object({
  id: z.string().optional(),
  content: ContentInput,
  isCorrect: z.boolean(),
});

// ─── MCQ seed schema ──────────────────────────────────────────────────────────

const MCQSeedSchema = z.object({
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  examIds: z.array(z.string()).min(1),
  examSectionIds: z.array(z.string()).default([]),
  difficultyPerExam: z.record(z.string(), DifficultySchema).default({}),
  questionType: QuestionTypeSchema.default('SINGLE'),
  difficulty: DifficultySchema,
  question: ContentInput,
  options: z.array(OptionSchema).min(2).max(6),
  explanation: ContentInput.optional(),
  hint: ContentInput.optional(),
  tagIds: z.array(z.string()).default([]),
  source: z.string().optional(),
  isPreviousYear: z.boolean().default(false),
  previousYearExam: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (d) => d.options.some((o) => o.isCorrect),
  'At least one option must be correct'
).refine(
  (d) => d.questionType !== 'SINGLE' || d.options.filter((o) => o.isCorrect).length === 1,
  'SINGLE type must have exactly one correct option'
);

const BulkSchema = z.array(MCQSeedSchema).min(1);

// ─── Normalise to full MCQ input ──────────────────────────────────────────────

function normalise(raw: z.infer<typeof MCQSeedSchema>) {
  return {
    ...raw,
    question: toBlocks(raw.question),
    options: raw.options.map((o, i) => ({
      id: o.id ?? randomUUID(),
      content: toBlocks(o.content),
      isCorrect: o.isCorrect,
    })),
    explanation: raw.explanation ? toBlocks(raw.explanation) : undefined,
    hint: raw.hint ? toBlocks(raw.hint) : undefined,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

const SYSTEM_USER = 'system-seed';

export async function POST(req: Request) {
  const err = requireApiKey(req);
  if (err) return err;

  const body = await req.json();
  const isBulk = Array.isArray(body);

  const parsed = isBulk ? BulkSchema.safeParse(body) : MCQSeedSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  if (isBulk) {
    const items = parsed.data as z.infer<typeof MCQSeedSchema>[];
    const results: { id?: string; error?: string; index: number }[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const mcq = await mcqService.create(normalise(items[i]) as never, SYSTEM_USER);
        results.push({ index: i, id: mcq.id });
      } catch (e) {
        results.push({ index: i, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    const failed = results.filter((r) => r.error);
    return apiSuccess(
      { created: results.filter((r) => r.id).map((r) => ({ index: r.index, id: r.id })), failed },
      { total: items.length, succeeded: items.length - failed.length, failed: failed.length },
      failed.length === items.length ? 400 : 201
    );
  }

  try {
    const mcq = await mcqService.create(
      normalise(parsed.data as z.infer<typeof MCQSeedSchema>) as never,
      SYSTEM_USER
    );
    return apiSuccess(mcq, undefined, 201);
  } catch (e) {
    console.error('[seed/mcqs]', e);
    return apiError(e instanceof Error ? e.message : 'Failed to create MCQ', 500);
  }
}
