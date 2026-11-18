import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { curriculumNodes, exams, mindMapNodes, mindMaps, users } from '@/server/db/schema';
import type { FlatMindMapNode, MindMapSnapshot, MindMapStatus } from '@/lib/mind-maps';
import type { SaveMindMapInput } from '@/schemas/mind-map.schema';

export type MindMapRow = typeof mindMaps.$inferSelect;

/** JS timestamps: the DB session zone isn't UTC, so DEFAULT now() would read back shifted. */
const now = () => new Date();

/** Parents before children, so one multi-row INSERT satisfies the self-referencing FK. */
function parentsFirst(rows: FlatMindMapNode[]): FlatMindMapNode[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const depth = (r: FlatMindMapNode): number => {
    let d = 0;
    for (let p = r.parentId; p && d <= rows.length; p = byId.get(p)?.parentId ?? null) d++;
    return d;
  };
  return [...rows].sort((a, b) => depth(a) - depth(b));
}

async function insertNodes(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], mindMapId: string, rows: FlatMindMapNode[]) {
  if (rows.length === 0) return;
  const at = now();
  await tx.insert(mindMapNodes).values(parentsFirst(rows).map((r) => ({ ...r, mindMapId, createdAt: at, updatedAt: at })));
}

// ── Admin ──────────────────────────────────────────────────────────────────────

async function listAdmin(filters: { examId?: string; status?: MindMapStatus }) {
  const nodeCounts = db
    .select({ mindMapId: mindMapNodes.mindMapId, total: sql<number>`count(*)`.as('total') })
    .from(mindMapNodes)
    .groupBy(mindMapNodes.mindMapId)
    .as('node_counts');

  const rows = await db
    .select({
      id: mindMaps.id,
      examId: mindMaps.examId,
      examName: exams.name,
      examSlug: exams.slug,
      chapterNodeId: mindMaps.chapterNodeId,
      chapterName: curriculumNodes.name,
      status: mindMaps.status,
      publishedAt: mindMaps.publishedAt,
      updatedAt: mindMaps.updatedAt,
      updatedByName: users.name,
      nodeCount: nodeCounts.total,
    })
    .from(mindMaps)
    .innerJoin(exams, eq(mindMaps.examId, exams.id))
    .innerJoin(curriculumNodes, eq(mindMaps.chapterNodeId, curriculumNodes.id))
    .leftJoin(users, eq(mindMaps.updatedBy, users.id))
    .leftJoin(nodeCounts, eq(nodeCounts.mindMapId, mindMaps.id))
    .where(and(filters.examId ? eq(mindMaps.examId, filters.examId) : undefined, filters.status ? eq(mindMaps.status, filters.status) : undefined))
    .orderBy(desc(mindMaps.updatedAt));

  return rows.map((r) => ({
    ...r,
    nodeCount: Number(r.nodeCount ?? 0),
    // Edited after the last publish → the live page is behind the draft.
    hasPendingChanges: r.status === 'PUBLISHED' && !!r.publishedAt && r.updatedAt.getTime() - r.publishedAt.getTime() > 1000,
  }));
}

/** Chapter ids that already have a map, per exam — for the "create" picker. */
async function listChapterIds(examIds: string[]) {
  if (examIds.length === 0) return [];
  return db.select({ examId: mindMaps.examId, chapterNodeId: mindMaps.chapterNodeId }).from(mindMaps).where(inArray(mindMaps.examId, examIds));
}

async function findById(id: string): Promise<MindMapRow | null> {
  const [row] = await db.select().from(mindMaps).where(eq(mindMaps.id, id)).limit(1);
  return row ?? null;
}

async function listNodes(mindMapId: string): Promise<FlatMindMapNode[]> {
  return db
    .select({
      id: mindMapNodes.id,
      parentId: mindMapNodes.parentId,
      curriculumNodeId: mindMapNodes.curriculumNodeId,
      label: mindMapNodes.label,
      description: mindMapNodes.description,
      content: mindMapNodes.content,
      displayOrder: mindMapNodes.displayOrder,
      labelHi: mindMapNodes.labelHi,
      style: mindMapNodes.style,
      tags: mindMapNodes.tags,
    })
    .from(mindMapNodes)
    .where(eq(mindMapNodes.mindMapId, mindMapId))
    .orderBy(asc(mindMapNodes.displayOrder));
}

/** Throws a duplicate-key error if the chapter already has a map for this exam. */
async function create(input: { examId: string; chapterNodeId: string; nodes: FlatMindMapNode[]; createdBy: string | null }) {
  const id = crypto.randomUUID();
  const at = now();
  await db.transaction(async (tx) => {
    await tx.insert(mindMaps).values({
      id,
      examId: input.examId,
      chapterNodeId: input.chapterNodeId,
      status: 'DRAFT',
      faqs: [],
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: at,
      updatedAt: at,
    });
    await insertNodes(tx, id, input.nodes);
  });
  return id;
}

/** Replaces the whole draft (fields + nodes) atomically. The published snapshot is untouched. */
async function saveDraft(id: string, input: SaveMindMapInput, updatedBy: string | null) {
  await db.transaction(async (tx) => {
    await tx
      .update(mindMaps)
      .set({
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        intro: input.intro,
        revisionNotes: input.revisionNotes,
        faqs: input.faqs,
        ...(input.theme ? { theme: input.theme } : {}),
        updatedBy,
        updatedAt: now(),
      })
      .where(eq(mindMaps.id, id));
    // Children cascade with their parents; delete roots-up is unnecessary.
    await tx.delete(mindMapNodes).where(eq(mindMapNodes.mindMapId, id));
    await insertNodes(tx, id, input.nodes);
  });
}

async function setStatus(id: string, status: MindMapStatus, updatedBy: string | null, snapshot?: MindMapSnapshot) {
  const at = now();
  await db
    .update(mindMaps)
    .set({
      status,
      updatedBy,
      // Publishing stamps updatedAt == publishedAt, so "pending changes" starts clean.
      ...(snapshot ? { publishedSnapshot: snapshot, publishedAt: at, updatedAt: at } : {}),
    })
    .where(eq(mindMaps.id, id));
}

async function remove(id: string) {
  await db.delete(mindMaps).where(eq(mindMaps.id, id));
}

// ── Public (published only) ────────────────────────────────────────────────────

const isLive = () => and(eq(mindMaps.status, 'PUBLISHED'), sql`${mindMaps.publishedSnapshot} IS NOT NULL`);

/**
 * Published maps for an exam — listing fields only (topic count and intro pulled out of the
 * snapshot in SQL, so the full JSON isn't transferred for a list).
 */
async function listPublishedByExam(examId: string) {
  const rows = await db
    .select({
      chapterNodeId: mindMaps.chapterNodeId,
      publishedAt: mindMaps.publishedAt,
      topicCount: sql<number>`json_length(${mindMaps.publishedSnapshot}, '$.nodes')`,
      intro: sql<string | null>`json_unquote(json_extract(${mindMaps.publishedSnapshot}, '$.intro'))`,
    })
    .from(mindMaps)
    .where(and(eq(mindMaps.examId, examId), isLive()));
  return rows.map((r) => ({ ...r, topicCount: Number(r.topicCount ?? 0), intro: r.intro && r.intro !== 'null' ? r.intro : null, publishedAt: r.publishedAt! }));
}

async function findPublished(examId: string, chapterNodeId: string) {
  const [row] = await db
    .select({ snapshot: mindMaps.publishedSnapshot, publishedAt: mindMaps.publishedAt })
    .from(mindMaps)
    .where(and(eq(mindMaps.examId, examId), eq(mindMaps.chapterNodeId, chapterNodeId), isLive()))
    .limit(1);
  return row?.snapshot ? { snapshot: row.snapshot, publishedAt: row.publishedAt! } : null;
}

/** Published maps across ACTIVE exams — for the sitemap. */
async function listPublishedForSitemap() {
  return db
    .select({ examId: mindMaps.examId, examSlug: exams.slug, chapterNodeId: mindMaps.chapterNodeId, publishedAt: mindMaps.publishedAt })
    .from(mindMaps)
    .innerJoin(exams, eq(mindMaps.examId, exams.id))
    .where(and(isLive(), eq(exams.status, 'ACTIVE')));
}

/** Curriculum descriptions for a set of nodes (SyllabusNode doesn't carry them). */
async function curriculumDescriptions(nodeIds: string[]): Promise<Map<string, string | null>> {
  if (nodeIds.length === 0) return new Map();
  const rows = await db.select({ id: curriculumNodes.id, description: curriculumNodes.description }).from(curriculumNodes).where(inArray(curriculumNodes.id, nodeIds));
  return new Map(rows.map((r) => [r.id, r.description]));
}

export const mindMapRepository = {
  listAdmin,
  listChapterIds,
  findById,
  listNodes,
  create,
  saveDraft,
  setStatus,
  remove,
  listPublishedByExam,
  findPublished,
  listPublishedForSitemap,
  curriculumDescriptions,
};
