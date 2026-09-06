import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { articles, users, contentNodeMap, examNodeMap } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import { taxonomyRepository } from './taxonomy.repository';
import type { ARTICLE_STATUS_VALUES, CreateArticleInput, UpdateArticleInput } from '@/schemas/article.schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface FindAllOptions {
  status?: (typeof ARTICLE_STATUS_VALUES)[number];
  authorId?: string;
  sort?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

async function findAll(options: FindAllOptions = {}) {
  const { status, authorId, sort = 'desc', page = 1, limit = 50 } = options;

  const conditions = [];
  if (status) conditions.push(eq(articles.status, status));
  if (authorId) conditions.push(eq(articles.authorId, authorId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = sort === 'asc' ? asc(articles.updatedAt) : desc(articles.updatedAt);
  const offset = (page - 1) * limit;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(articles).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(articles).where(where),
  ]);

  return { rows, total: Number(count) };
}

// Distinct authors who have written at least one article — powers the "Created By"
// filter dropdown on the admin list.
async function listAuthors() {
  return db
    .selectDistinct({ id: users.id, name: users.name, email: users.email })
    .from(articles)
    .innerJoin(users, eq(articles.authorId, users.id))
    .orderBy(users.name);
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
    .select({
      article: articles,
      author: { id: users.id, name: users.name, image: users.image, college: users.college, degree: users.degree },
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC')))
    .limit(1);
  return row ?? null;
}

async function findPublishedByAuthor(authorId: string, limit = 6) {
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.authorId, authorId), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC')))
    .orderBy(desc(articles.updatedAt))
    .limit(limit);
}

// Same shape as question.repository's setNodeTag: one explicit leaf node (PRIMARY) plus
// every ancestor (SUPPLEMENTARY, for "topic and everything under it" queries). Tags the
// article so the public detail page can find a matching concept-check question and
// suggested articles that share curriculum ground.
async function setNodeTags(tx: Tx, articleId: number, nodeId: string | undefined) {
  await tx.delete(contentNodeMap).where(and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articleId)));
  if (!nodeId) return;

  const ancestorIds = await taxonomyRepository.getAncestorIds(nodeId);
  await tx.insert(contentNodeMap).values({ id: randomUUID(), contentType: 'ARTICLE', contentId: articleId, nodeId, relationType: 'PRIMARY' });
  if (ancestorIds.size > 0) {
    await tx.insert(contentNodeMap).values(
      Array.from(ancestorIds).map((id) => ({
        id: randomUUID(),
        contentType: 'ARTICLE' as const,
        contentId: articleId,
        nodeId: id,
        relationType: 'SUPPLEMENTARY' as const,
      }))
    );
  }
}

async function findNodeForArticle(articleId: number) {
  const [row] = await db
    .select({ nodeId: contentNodeMap.nodeId })
    .from(contentNodeMap)
    .where(and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articleId), eq(contentNodeMap.relationType, 'PRIMARY')))
    .limit(1);
  return row ?? null;
}

// All tagged nodes (leaf + ancestors) — the match set for "same node" concept-check
// questions and suggested articles, not just the one explicit leaf tag.
async function findNodeIdsForArticle(articleId: number) {
  const rows = await db
    .select({ nodeId: contentNodeMap.nodeId })
    .from(contentNodeMap)
    .where(and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articleId)));
  return rows.map((r) => r.nodeId);
}

async function findRelatedPublished(nodeIds: string[], excludeId: number, limit = 4) {
  if (nodeIds.length === 0) return [];
  return db
    .selectDistinct({ article: articles })
    .from(articles)
    .innerJoin(contentNodeMap, and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articles.id)))
    .where(
      and(
        eq(articles.status, 'PUBLISHED'),
        eq(articles.visibility, 'PUBLIC'),
        inArray(contentNodeMap.nodeId, nodeIds),
        ne(articles.id, excludeId)
      )
    )
    .orderBy(desc(articles.updatedAt))
    .limit(limit)
    .then((rows) => rows.map((r) => r.article));
}

// Article <-> exam is indirect (article -> content_node_map -> exam_node_map -> exam) —
// there's no direct exam column on articles. Powers the homepage's "Fresh Reading"
// carousel: featured articles (an editorial pin, see articles.isFeatured) lead, backfilled
// with the most recent published articles up to `limit`, deduped. Deliberately not named
// findTrending/findHot — recency + an explicit editorial flag, not a computed signal.
async function findPublishedByExam(examId: string, limit = 10, featuredCount = 3) {
  const whereBase = and(eq(examNodeMap.examId, examId), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC'));

  const [featuredRows, latestRows] = await Promise.all([
    db
      .selectDistinct({ article: articles })
      .from(articles)
      .innerJoin(contentNodeMap, and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articles.id)))
      .innerJoin(examNodeMap, eq(examNodeMap.nodeId, contentNodeMap.nodeId))
      .where(and(whereBase, eq(articles.isFeatured, true)))
      .orderBy(desc(articles.createdAt))
      .limit(featuredCount),
    db
      .selectDistinct({ article: articles })
      .from(articles)
      .innerJoin(contentNodeMap, and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articles.id)))
      .innerJoin(examNodeMap, eq(examNodeMap.nodeId, contentNodeMap.nodeId))
      .where(whereBase)
      .orderBy(desc(articles.createdAt))
      .limit(limit),
  ]);

  const seen = new Set<number>();
  const merged: (typeof articles.$inferSelect)[] = [];
  for (const row of featuredRows) {
    merged.push(row.article);
    seen.add(row.article.id);
  }
  for (const row of latestRows) {
    if (merged.length >= limit) break;
    if (seen.has(row.article.id)) continue;
    merged.push(row.article);
    seen.add(row.article.id);
  }
  return merged.slice(0, limit);
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

  let id = 0;
  await db.transaction(async (tx) => {
    const [result] = await tx.insert(articles).values({
      title: input.title,
      slug,
      summary: input.summary,
      body: input.body,
      status: input.status,
      visibility: input.visibility,
      articleType: input.articleType,
      isFeatured: input.isFeatured,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      keywords: input.keywords,
      ogImage: input.ogImage,
      authorId,
    });
    id = result.insertId;
    if (input.nodeId) await setNodeTags(tx, id, input.nodeId);
  });

  return findById(id);
}

async function update(id: number, input: UpdateArticleInput, editorId: string | null = null) {
  const { nodeId, ...rest } = input;
  const patch: Partial<typeof articles.$inferInsert> = { ...rest, updatedAt: new Date(), updatedBy: editorId ?? undefined };

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

  await db.transaction(async (tx) => {
    await tx.update(articles).set(patch).where(eq(articles.id, id));
    if (nodeId !== undefined) await setNodeTags(tx, id, nodeId);
  });
  return findById(id);
}

async function setStatusMany(ids: number[], status: (typeof ARTICLE_STATUS_VALUES)[number], editorId: string | null = null) {
  if (ids.length === 0) return [];
  await db
    .update(articles)
    .set({ status, updatedAt: new Date(), updatedBy: editorId ?? undefined })
    .where(inArray(articles.id, ids));
  return db.select().from(articles).where(inArray(articles.id, ids));
}

export const articleRepository = {
  findAll,
  listAuthors,
  findById,
  findBySlug,
  findByIdWithAuthor,
  findPublished,
  findPublishedBySlug,
  findPublishedBySlugWithAuthor,
  findPublishedByAuthor,
  findPublishedByExam,
  findNodeForArticle,
  findNodeIdsForArticle,
  findRelatedPublished,
  create,
  update,
  setStatusMany,
};
