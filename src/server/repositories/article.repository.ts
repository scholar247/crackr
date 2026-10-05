import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { articles, users, contentNodeMap, contentExamMap, curriculumNodes, examNodeMap } from '@/server/db/schema';
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

export type BlogListSort = 'latest' | 'oldest' | 'title';

export interface ListPublishedPageOptions {
  /** Only articles belonging to this exam (tagged to any of its syllabus nodes, or directly to the exam). */
  examId?: string;
  /** Only articles tagged to this curriculum node. Ancestors are tagged too, so a parent node includes everything under it. */
  nodeId?: string;
  sort?: BlogListSort;
  page?: number;
  pageSize?: number;
}

const PUBLISHED_PUBLIC = () => and(eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC'));

// Paginated public listing for /blogs and its exam/subject/topic drill-down pages. "Latest"
// is by creation time (an edit shouldn't bump an old post back to the top), id as tiebreak so
// pagination is stable when timestamps tie.
async function listPublishedPage({ examId, nodeId, sort = 'latest', page = 1, pageSize = 10 }: ListPublishedPageOptions = {}) {
  const conditions = [PUBLISHED_PUBLIC()];

  if (examId) {
    conditions.push(
      sql`(${articles.id} IN (
          SELECT ${contentNodeMap.contentId} FROM ${contentNodeMap}
          INNER JOIN ${examNodeMap} ON ${examNodeMap.nodeId} = ${contentNodeMap.nodeId}
          WHERE ${contentNodeMap.contentType} = 'ARTICLE' AND ${examNodeMap.examId} = ${examId}
        ) OR ${articles.id} IN (
          SELECT ${contentExamMap.contentId} FROM ${contentExamMap}
          WHERE ${contentExamMap.contentType} = 'ARTICLE' AND ${contentExamMap.examId} = ${examId}
        ))`
    );
  }
  if (nodeId) {
    conditions.push(
      inArray(
        articles.id,
        db
          .select({ id: contentNodeMap.contentId })
          .from(contentNodeMap)
          .where(and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.nodeId, nodeId)))
      )
    );
  }
  const where = and(...conditions);

  const orderBy =
    sort === 'oldest' ? [asc(articles.createdAt), asc(articles.id)] : sort === 'title' ? [asc(articles.title), asc(articles.id)] : [desc(articles.createdAt), desc(articles.id)];

  const [[countRow], items] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(articles).where(where),
    db
      .select()
      .from(articles)
      .where(where)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { items, total: Number(countRow?.n ?? 0) };
}

// Published-article counts per curriculum node (a node's count includes everything tagged
// beneath it, since ancestors are tagged too) — for the drill-down tables' badges.
async function countPublishedByNode(): Promise<Map<string, number>> {
  const rows = await db
    .select({ nodeId: contentNodeMap.nodeId, n: sql<number>`count(distinct ${contentNodeMap.contentId})` })
    .from(contentNodeMap)
    .innerJoin(articles, eq(articles.id, contentNodeMap.contentId))
    .where(and(eq(contentNodeMap.contentType, 'ARTICLE'), PUBLISHED_PUBLIC()))
    .groupBy(contentNodeMap.nodeId);
  return new Map(rows.map((r) => [r.nodeId, Number(r.n)]));
}

// Published-article counts per exam, same membership rule as the exam filter above.
async function countPublishedByExam(): Promise<Map<string, number>> {
  const [rows] = (await db.execute(sql`
    SELECT x.exam_id AS examId, COUNT(DISTINCT x.article_id) AS n
    FROM (
      SELECT enm.exam_id AS exam_id, cnm.content_id AS article_id
      FROM ${contentNodeMap} cnm
      INNER JOIN ${examNodeMap} enm ON enm.node_id = cnm.node_id
      WHERE cnm.content_type = 'ARTICLE'
      UNION ALL
      SELECT cem.exam_id, cem.content_id FROM ${contentExamMap} cem WHERE cem.content_type = 'ARTICLE'
    ) x
    INNER JOIN ${articles} a ON a.id = x.article_id AND a.status = 'PUBLISHED' AND a.visibility = 'PUBLIC'
    GROUP BY x.exam_id
  `)) as unknown as [{ examId: string; n: number }[], unknown];
  return new Map(rows.map((r) => [r.examId, Number(r.n)]));
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
// `precomputedAncestorIds` lets bulk callers resolve the ancestor chain once for many articles.
async function setNodeTags(tx: Tx, articleId: number, nodeId: string | undefined, precomputedAncestorIds?: Set<string>) {
  await tx.delete(contentNodeMap).where(and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articleId)));
  if (!nodeId) return;

  const ancestorIds = precomputedAncestorIds ?? (await taxonomyRepository.getAncestorIds(nodeId));
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

// Every non-deleted article with the node it is currently mapped to (PRIMARY), for the admin
// bulk-mapping screen — light fields only, since this lists the whole library.
async function listForNodeMapping() {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      nodeId: contentNodeMap.nodeId,
      nodeName: curriculumNodes.name,
    })
    .from(articles)
    .leftJoin(
      contentNodeMap,
      and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articles.id), eq(contentNodeMap.relationType, 'PRIMARY'))
    )
    .leftJoin(curriculumNodes, eq(curriculumNodes.id, contentNodeMap.nodeId))
    .where(ne(articles.status, 'DELETED'))
    .orderBy(desc(articles.updatedAt));
}

// Maps many articles to one node (or clears their mapping when nodeId is null). Each article
// gets the same tags a single-article edit gives it: the node itself plus every ancestor up
// to the root. Replaces whatever the article was mapped to before. All-or-nothing.
async function mapManyToNode(ids: number[], nodeId: string | null) {
  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(inArray(articles.id, ids), ne(articles.status, 'DELETED')));
  const targetIds = existing.map((r) => r.id);
  if (targetIds.length === 0) return 0;

  const ancestorIds = nodeId ? await taxonomyRepository.getAncestorIds(nodeId) : undefined;
  await db.transaction(async (tx) => {
    for (const id of targetIds) await setNodeTags(tx, id, nodeId ?? undefined, ancestorIds);
  });
  return targetIds.length;
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

  if (rest.status === 'DELETED') {
    await deleteOne(id);
    return null;
  }

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

async function deleteOne(id: number) {
  await db.transaction(async (tx) => {
    await tx.delete(contentNodeMap).where(and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, id)));
    await tx.delete(articles).where(eq(articles.id, id));
  });
}

async function deleteMany(ids: number[]) {
  if (ids.length === 0) return;
  await db.transaction(async (tx) => {
    await tx.delete(contentNodeMap).where(and(eq(contentNodeMap.contentType, 'ARTICLE'), inArray(contentNodeMap.contentId, ids)));
    await tx.delete(articles).where(inArray(articles.id, ids));
  });
}

async function setStatusMany(ids: number[], status: (typeof ARTICLE_STATUS_VALUES)[number], editorId: string | null = null) {
  if (ids.length === 0) return [];

  if (status === 'DELETED') {
    await deleteMany(ids);
    return [];
  }

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
  listPublishedPage,
  countPublishedByNode,
  countPublishedByExam,
  findPublishedBySlugWithAuthor,
  findPublishedByAuthor,
  findPublishedByExam,
  listForNodeMapping,
  mapManyToNode,
  findNodeForArticle,
  findNodeIdsForArticle,
  findRelatedPublished,
  create,
  update,
  deleteOne,
  deleteMany,
  setStatusMany,
};
