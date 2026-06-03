import { z } from 'zod';
import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError, slugify } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';

/**
 * Subjects are shared across exams — "Mathematics" exists once.
 * Multiple exams reference the same subject ID via their subjectIds[].
 * Dedup key: slug (globally unique).
 */
const Schema = z.object({
  name: z.string().min(1),
  shortName: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  iconName: z.string().default('BookOpen'),
  color: z.string().default('#6366f1'),
  isActive: z.boolean().default(true),
});

type Input = z.infer<typeof Schema>;

async function upsertSubject(item: Input): Promise<{ data: object; existing: boolean }> {
  const slug = item.slug ?? slugify(item.name);
  const found = await subjectRepository.findBySlug(slug);
  if (found) return { data: found, existing: true };

  const created = await subjectRepository.create({
    ...item,
    shortName: item.shortName ?? item.name.slice(0, 20),
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
        upsertSubject(item).then(({ data, existing }) => ({ index, existing, ...(data as object) }))
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
    const { data, existing } = await upsertSubject(parsed.data);
    return apiSuccess(data, { existing }, existing ? 200 : 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed', 500);
  }
}
