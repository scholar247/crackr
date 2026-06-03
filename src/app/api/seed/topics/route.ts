import { z } from 'zod';
import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError, slugify } from '@/lib/utils';
import { topicRepository } from '@/server/repositories/topic.repository';

/**
 * Topics are SCOPED to a subject — "Algebra" under Mathematics is a different
 * entity from "Algebra" under Statistics, so there is no cross-subject conflict.
 *
 * Dedup key: (slug + subjectId + parentId)
 *   - Two chapters with the same name in the same subject → duplicate → return existing
 *   - Same name in different subjects → different entities, both created
 *   - Same name, different parent in the same subject → different entities (different paths)
 *
 * Hierarchy:
 *   parentId=null           → Chapter  (depth 0)
 *   parentId=<chapterId>    → Section  (depth 1)
 *   parentId=<sectionId>    → Subtopic (depth 2)
 *
 * Bulk creation is sequential (not parallel) so parent IDs are available
 * before child rows are processed.
 */
const Schema = z.object({
  name: z.string().min(1),
  subjectId: z.string().min(1),
  parentId: z.string().nullable().default(null),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

type Input = z.infer<typeof Schema>;

async function upsertTopic(item: Input): Promise<{ data: object; existing: boolean }> {
  const slug = slugify(item.name);
  const found = await topicRepository.findBySlugInSubject(slug, item.subjectId, item.parentId);
  if (found) return { data: found, existing: true };

  const created = await topicRepository.create(item);
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
      // Sequential — preserves parent→child ordering within the same batch
      const results: object[] = [];
      for (const [index, item] of parsed.data.entries()) {
        const { data, existing } = await upsertTopic(item);
        results.push({ index, existing, ...(data as object) });
      }
      const created = (results as { existing: boolean }[]).filter((r) => !r.existing).length;
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
    const { data, existing } = await upsertTopic(parsed.data);
    return apiSuccess(data, { existing }, existing ? 200 : 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed', 500);
  }
}
