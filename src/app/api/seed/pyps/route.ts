import { z } from 'zod';
import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';
import { examRepository } from '@/server/repositories/exam.repository';

/**
 * Dedup key: (examId + year + month) — one paper per exam per sitting.
 * If a PYP already exists for that combination the existing record is returned.
 * Any mcqIds provided are still added (idempotently) even on an existing PYP.
 */
const Schema = z.object({
  examId: z.string().min(1),
  title: z.string().min(2).max(200),
  slug: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  mcqIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const err = requireApiKey(req);
  if (err) return err;

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { mcqIds, ...pypData } = parsed.data;

  try {
    const exam = await examRepository.findById(pypData.examId);
    if (!exam) return apiError('Exam not found', 404);

    // Dedup on (examId, year, month)
    let pyp = await pypRepository.findByExamYearMonth(pypData.examId, pypData.year, pypData.month);
    let existing = true;

    if (!pyp) {
      pyp = await pypRepository.create(pypData, exam.name, exam.slug);
      existing = false;
    }

    // Always process mcqIds (safe to call addMCQs; it uses $addToSet so no dupes)
    if (mcqIds && mcqIds.length > 0) {
      pyp = await pypRepository.addMCQs(pyp.id, mcqIds, pyp.title) ?? pyp;
    }

    return apiSuccess(pyp, { existing }, existing ? 200 : 201);
  } catch (e) {
    console.error('[seed/pyps]', e);
    return apiError('Failed to create PYP', 500);
  }
}
