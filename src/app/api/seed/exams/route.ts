import { z } from 'zod';
import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError, slugify } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { ExamCategorySchema } from '@/schemas';

/**
 * Dedup key: slug (globally unique).
 * If an exam with the same slug exists, the existing record is returned
 * and subjectIds are NOT merged — use the admin UI for that.
 */
const Schema = z.object({
  name: z.string().min(1),
  fullName: z.string().optional(),
  slug: z.string().optional(),
  category: ExamCategorySchema,
  conductedBy: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  officialWebsite: z.string().optional(),
  subjectIds: z.array(z.string()).min(1),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type Input = z.infer<typeof Schema>;

async function upsertExam(item: Input): Promise<{ data: object; existing: boolean }> {
  const slug = item.slug ?? slugify(item.name);
  const found = await examRepository.findBySlug(slug);
  if (found) return { data: found, existing: true };

  const created = await examRepository.create({
    ...item,
    fullName: item.fullName ?? item.name,
    slug,
  });
  return { data: created, existing: false };
}

export async function POST(req: Request) {
  const err = requireApiKey(req);
  if (err) return err;

  const body = await req.json();
  const isBulk = Array.isArray(body);

  if (isBulk) {
    const parsed = z.array(Schema).min(1).safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const results = await Promise.all(parsed.data.map((item, index) =>
        upsertExam(item).then(({ data, existing }) => ({ index, existing, ...(data as object) }))
      ));
      const created = results.filter((r) => !r.existing).length;
      return apiSuccess(results, { total: results.length, created, existing: results.length - created }, 201);
    } catch (e) {
      return apiError(e instanceof Error ? e.message : 'Failed', 500);
    }
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const { data, existing } = await upsertExam(parsed.data);
    return apiSuccess(data, { existing }, existing ? 200 : 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed', 500);
  }
}
