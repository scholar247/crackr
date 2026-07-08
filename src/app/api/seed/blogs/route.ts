import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { blogRepository } from '@/server/repositories/blog.repository';
import { CreateBlogSchema } from '@/schemas/blog.schema';
import { z } from 'zod';

const BlogSeedSchema = CreateBlogSchema.extend({
  authorEmail: z.string().email().optional(),
  authorId: z.string().optional(),
});

const BulkBlogSeedSchema = z.array(BlogSeedSchema).min(1).max(50);

const SEED_USER_ID = 'system-seed';
const SEED_USER_EMAIL = 'seed@scholar247.org';

export async function POST(req: Request) {
  const err = requireApiKey(req);
  if (err) return err;

  const body = await req.json();
  const isBulk = Array.isArray(body);

  if (isBulk) {
    const parsed = BulkBlogSeedSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const results: { index: number; id?: string; slug?: string; error?: string }[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const item = parsed.data[i];
      try {
        const { authorEmail, authorId, ...blogData } = item;
        const blog = await blogRepository.create(
          { ...blogData, status: blogData.status ?? 'DRAFT' },
          authorId ?? SEED_USER_ID,
          authorEmail ?? SEED_USER_EMAIL,
        );
        results.push({ index: i, id: blog.id, slug: blog.slug });
      } catch (e) {
        results.push({ index: i, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    const created = results.filter((r) => r.id).length;
    const failed = results.filter((r) => r.error).length;

    return apiSuccess(
      { results },
      { total: parsed.data.length, created, failed },
      failed === parsed.data.length ? 400 : 201,
    );
  }

  // Single blog
  const parsed = BlogSeedSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { authorEmail, authorId, ...blogData } = parsed.data;
    const blog = await blogRepository.create(
      { ...blogData, status: blogData.status ?? 'DRAFT' },
      authorId ?? SEED_USER_ID,
      authorEmail ?? SEED_USER_EMAIL,
    );
    return apiSuccess({ id: blog.id, slug: blog.slug, title: blog.title }, {}, 201);
  } catch (e) {
    console.error('[seed/blogs]', e);
    return apiError(e instanceof Error ? e.message : 'Failed to create blog', 500);
  }
}
