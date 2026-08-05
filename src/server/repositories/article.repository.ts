import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { articles, users } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import type { CreateArticleInput, UpdateArticleInput } from '@/schemas/article.schema';

async function findAll() {
  return db.select().from(articles).orderBy(desc(articles.updatedAt));
}

async function findById(id: string) {
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return row ?? null;
}

async function findBySlug(slug: string) {
  const [row] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
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

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await findBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

async function create(input: CreateArticleInput, authorId: string) {
  const baseSlug = slugify(input.slug || input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const [row] = await db
    .insert(articles)
    .values({
      title: input.title,
      slug,
      summary: input.summary,
      body: input.body,
      status: input.status,
      visibility: input.visibility,
      authorId,
    })
    .returning();
  return row;
}

async function update(id: string, input: UpdateArticleInput) {
  const patch: Partial<typeof articles.$inferInsert> = { ...input, updatedAt: new Date() };

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

  const [row] = await db.update(articles).set(patch).where(eq(articles.id, id)).returning();
  return row ?? null;
}

export const articleRepository = {
  findAll,
  findById,
  findBySlug,
  findPublished,
  findPublishedBySlug,
  findPublishedBySlugWithAuthor,
  create,
  update,
};
