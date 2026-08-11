import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { articles, users } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import type { CreateArticleInput, UpdateArticleInput } from '@/schemas/article.schema';

async function findAll() {
  return db.select().from(articles).orderBy(desc(articles.updatedAt));
}

async function findById(id: number) {
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return row ?? null;
}

async function findBySlug(slug: string) {
  const [row] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return row ?? null;
}

// For the admin preview page — any status/visibility, unlike findPublishedBySlugWithAuthor.
async function findByIdWithAuthor(id: number) {
  const [row] = await db
    .select({ article: articles, author: { name: users.name, image: users.image } })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.id, id))
    .limit(1);
  return row ?? null;
}

// Public site only ever sees PUBLISHED + PUBLIC — enforced here, once, rather than
// re-implemented in every route handler that touches articles.
async function findPublished() {
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC')))
    .orderBy(desc(articles.updatedAt));
}

async function findPublishedBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC')))
    .limit(1);
  return row ?? null;
}

async function findPublishedBySlugWithAuthor(slug: string) {
  const [row] = await db
    .select({ article: articles, author: { name: users.name, image: users.image } })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC')))
    .limit(1);
  return row ?? null;
}

async function ensureUniqueSlug(base: string, excludeId?: number) {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await findBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

async function create(input: CreateArticleInput, authorId: string | null) {
  const baseSlug = slugify(input.slug || input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const [result] = await db.insert(articles).values({
    title: input.title,
    slug,
    summary: input.summary,
    body: input.body,
    status: input.status,
    visibility: input.visibility,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    keywords: input.keywords,
    ogImage: input.ogImage,
    authorId,
  });

  return findById(result.insertId);
}

async function update(id: number, input: UpdateArticleInput, editorId: string | null = null) {
  const patch: Partial<typeof articles.$inferInsert> = { ...input, updatedAt: new Date(), updatedBy: editorId ?? undefined };

  if (input.slug || input.title) {
    const current = await findById(id);
    if (!current) return null;
    const baseSlug = slugify(input.slug || input.title || current.title);
    if (baseSlug !== current.slug) {
      patch.slug = await ensureUniqueSlug(baseSlug, id);
    } else {
      delete patch.slug;
    }
  }

  await db.update(articles).set(patch).where(eq(articles.id, id));
  return findById(id);
}

export const articleRepository = {
  findAll,
  findById,
  findBySlug,
  findByIdWithAuthor,
  findPublished,
  findPublishedBySlug,
  findPublishedBySlugWithAuthor,
  create,
  update,
};
