import { asc, eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { db } from '@/server/db/client';
import { programs, exams, curriculumNodes, curriculumEdges, examNodeMap } from '@/server/db/schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { slugify } from '@/lib/utils';

export interface SyllabusNode {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  children: SyllabusNode[];
}

async function ensureUniqueSlug<T extends { slug: string }>(
  base: string,
  lookup: (slug: string) => Promise<T | null>,
): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (await lookup(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

// ── Programs ────────────────────────────────────────────────────────────────

async function listPrograms() {
  return db.select().from(programs).orderBy(asc(programs.name));
}

async function findProgramBySlug(slug: string) {
  const [row] = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  return row ?? null;
}

async function findProgramById(id: string) {
  const [row] = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  return row ?? null;
}

async function createProgram(input: { name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(input.name), findProgramBySlug);
  const id = randomUUID();
  await db.insert(programs).values({ id, name: input.name, slug, description: input.description });
  return findProgramBySlug(slug);
}

// Slug is deliberately left untouched on edit — simpler and avoids anything else needing
// to track a slug change; programs don't have their own public detail page today anyway.
async function updateProgram(id: string, input: { name?: string; description?: string; status?: 'ACTIVE' | 'ARCHIVED' }) {
  await db
    .update(programs)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(programs.id, id));
  return findProgramById(id);
}

// ── Exams ───────────────────────────────────────────────────────────────────

async function listExams() {
  return db
    .select({ exam: exams, programName: programs.name })
    .from(exams)
    .innerJoin(programs, eq(exams.programId, programs.id))
    .orderBy(asc(exams.name));
}

async function listPublicExams() {
  return db
    .select({ exam: exams, programName: programs.name })
    .from(exams)
    .innerJoin(programs, eq(exams.programId, programs.id))
    .where(eq(exams.status, 'ACTIVE'))
    .orderBy(asc(exams.name));
}

async function findExamBySlug(slug: string) {
  const [row] = await db.select().from(exams).where(eq(exams.slug, slug)).limit(1);
  return row ?? null;
}

async function findExamById(id: string) {
  const [row] = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  return row ?? null;
}

async function createExam(input: { programId: string; name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(input.name), findExamBySlug);
  const id = randomUUID();
  await db.insert(exams).values({ id, programId: input.programId, name: input.name, slug, description: input.description });
  return findExamBySlug(slug);
}

// programId is reassignable here — this is how an exam moves to a different program (an
// exam belongs to exactly one program, a plain FK, not a mapping table — the ERD itself
// defines program->exam as 1-to-many, unlike exam<->curriculum_node below).
async function updateExam(
  id: string,
  input: { name?: string; description?: string; status?: 'ACTIVE' | 'ARCHIVED'; programId?: string },
) {
  await db
    .update(exams)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(exams.id, id));
  return findExamById(id);
}

// ── Curriculum nodes ────────────────────────────────────────────────────────

async function listNodes() {
  return db.select().from(curriculumNodes).orderBy(asc(curriculumNodes.name));
}

async function findNodeBySlug(slug: string) {
  const [row] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1);
  return row ?? null;
}

async function findNodeById(id: string) {
  const [row] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.id, id)).limit(1);
  return row ?? null;
}

// ── exam <-> curriculum_node (genuine many-to-many via exam_node_map) ────────

async function attachNodeToExam(examId: string, nodeId: string) {
  try {
    await db.insert(examNodeMap).values({ examId, nodeId });
  } catch (err) {
    // Emulates ON CONFLICT DO NOTHING — examNodeMap's (examId, nodeId) composite primary
    // key already prevents duplicates; a re-attach attempt is a harmless no-op.
    if (!isDuplicateKeyError(err)) throw err;
  }
}

async function detachNodeFromExam(examId: string, nodeId: string) {
  await db.delete(examNodeMap).where(and(eq(examNodeMap.examId, examId), eq(examNodeMap.nodeId, nodeId)));
}

async function listNodeIdsForExam(examId: string): Promise<string[]> {
  const rows = await db.select({ nodeId: examNodeMap.nodeId }).from(examNodeMap).where(eq(examNodeMap.examId, examId));
  return rows.map((r) => r.nodeId);
}

// Reconciles exam_node_map to exactly `nodeIds` for this exam — attaches what's missing,
// detaches what's no longer wanted, leaves the rest alone.
async function setExamNodes(examId: string, nodeIds: string[]) {
  const current = new Set(await listNodeIdsForExam(examId));
  const desired = new Set(nodeIds);

  for (const nodeId of desired) {
    if (!current.has(nodeId)) await attachNodeToExam(examId, nodeId);
  }
  for (const nodeId of current) {
    if (!desired.has(nodeId)) await detachNodeFromExam(examId, nodeId);
  }
}

async function createNode(input: {
  nodeType: 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';
  name: string;
  description?: string;
  parentNodeId?: string;
  examId?: string;
}) {
  const slug = await ensureUniqueSlug(slugify(input.name), findNodeBySlug);
  const id = randomUUID();
  await db.insert(curriculumNodes).values({ id, nodeType: input.nodeType, name: input.name, slug, description: input.description });

  if (input.parentNodeId) {
    await db.insert(curriculumEdges).values({ parentNodeId: input.parentNodeId, childNodeId: id, sortOrder: 0 });
  }
  if (input.examId) {
    await attachNodeToExam(input.examId, id);
  }

  return findNodeBySlug(slug);
}

// name/description/status only — nodeType stays fixed once created (changing SUBJECT to
// CHAPTER etc. after the fact would be more likely to corrupt an existing tree than fix one).
async function updateNode(id: string, input: { name?: string; description?: string; status?: 'ACTIVE' | 'ARCHIVED' }) {
  await db
    .update(curriculumNodes)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(curriculumNodes.id, id));
  return findNodeById(id);
}

// ── curriculum_node <-> curriculum_node (genuine many-to-many parent/child via
// curriculum_edges — a node CAN have more than one parent, e.g. "Thermodynamics" mapped
// under both Physics and Chemistry) ──────────────────────────────────────────

async function getNodeParentIds(nodeId: string): Promise<string[]> {
  const rows = await db
    .select({ parentNodeId: curriculumEdges.parentNodeId })
    .from(curriculumEdges)
    .where(eq(curriculumEdges.childNodeId, nodeId));
  return rows.map((r) => r.parentNodeId);
}

// All descendants of nodeId (children, grandchildren, ...) — used only to guard against
// cycles: attaching one of nodeId's own descendants as a new parent would make nodeId an
// ancestor of its own ancestor.
async function getDescendantIds(nodeId: string): Promise<Set<string>> {
  const [rows] = (await db.execute<{ id: string }>(sql`
    WITH RECURSIVE descendants AS (
      SELECT child_node_id AS id FROM ${curriculumEdges} WHERE parent_node_id = ${nodeId}
      UNION
      SELECT edge.child_node_id AS id
      FROM ${curriculumEdges} edge
      INNER JOIN descendants d ON d.id = edge.parent_node_id
    )
    SELECT id FROM descendants
  `)) as unknown as [{ id: string }[], unknown];
  return new Set(rows.map((r) => r.id));
}

// Reconciles this node's parent edges to exactly `parentNodeIds` — attaches what's
// missing, detaches what's no longer wanted. This is "add chapter to subject" / "add
// topic to chapter" for nodes that already exist, and also how Thermodynamics ends up
// under both Physics and Chemistry: call this with both subject ids.
async function setNodeParents(nodeId: string, parentNodeIds: string[]) {
  const desired = new Set(parentNodeIds);
  if (desired.has(nodeId)) {
    throw new Error('A node cannot be its own parent');
  }

  const descendants = await getDescendantIds(nodeId);
  for (const parentId of desired) {
    if (descendants.has(parentId)) {
      throw new Error('That would create a cycle — the selected parent is a descendant of this node');
    }
  }

  const current = new Set(await getNodeParentIds(nodeId));
  for (const parentId of desired) {
    if (!current.has(parentId)) {
      await db.insert(curriculumEdges).values({ parentNodeId: parentId, childNodeId: nodeId, sortOrder: 0 });
    }
  }
  for (const parentId of current) {
    if (!desired.has(parentId)) {
      await db.delete(curriculumEdges).where(and(eq(curriculumEdges.parentNodeId, parentId), eq(curriculumEdges.childNodeId, nodeId)));
    }
  }
}

interface NodeWithParents {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  parents: { id: string; name: string }[];
}

async function listNodesWithParents(): Promise<NodeWithParents[]> {
  const parentNode = alias(curriculumNodes, 'parent_node');
  const [nodes, edgeRows] = await Promise.all([
    db.select().from(curriculumNodes).orderBy(asc(curriculumNodes.name)),
    db
      .select({ childId: curriculumEdges.childNodeId, parentId: curriculumEdges.parentNodeId, parentName: parentNode.name })
      .from(curriculumEdges)
      .innerJoin(parentNode, eq(parentNode.id, curriculumEdges.parentNodeId)),
  ]);

  const parentsByChild = new Map<string, { id: string; name: string }[]>();
  for (const edge of edgeRows) {
    const list = parentsByChild.get(edge.childId) ?? [];
    list.push({ id: edge.parentId, name: edge.parentName });
    parentsByChild.set(edge.childId, list);
  }

  return nodes.map((n) => ({ ...n, parents: parentsByChild.get(n.id) ?? [] }));
}

// ── Syllabus tree (recursive descendants of an exam's mapped root nodes) ─────

interface DescendantRow extends Record<string, unknown> {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  parentId: string | null;
}

async function getSyllabusTree(examId: string): Promise<SyllabusNode[]> {
  // The ERD's own sample data maps both a subject AND its deep descendants directly into
  // exam_node_map (not just top-level roots — see "root or relevant nodes" in the ERD).
  // So `reachable` dedupes by node id via UNION (not UNION ALL) first; each node's actual
  // parent(s) are then resolved separately via curriculum_edges, so a node that's both
  // directly mapped and reachable through an ancestor still nests exactly once per real
  // parent — not as a duplicate phantom root.
  //
  // The join to curriculum_edges is constrained to `edge.parent_node_id IN (reachable)`
  // — without that, a node with a parent OUTSIDE this exam's relevant subtree (e.g.
  // Thermodynamics under Chemistry, when only Physics is reachable for this exam) would
  // produce a row whose parentId isn't in `byId`, and the loop below would push it as a
  // second, spurious root in addition to its legitimate position under Physics. A node
  // can validly have more than one parent now (Thermodynamics under both Physics and
  // Chemistry) — when that happens for a node reachable via multiple relevant parents,
  // it correctly nests under each of them (same shared object pushed into multiple
  // children arrays), which is why `byId` uses one node object per id rather than one per
  // row.
  //
  // db.execute()'s return type is a union across all possible query kinds (SELECT vs
  // INSERT/UPDATE) since it can't statically know this raw SQL is a SELECT — cast the
  // destructured rows accordingly.
  const [rows] = (await db.execute<DescendantRow>(sql`
    WITH RECURSIVE reachable AS (
      SELECT node_id AS id FROM ${examNodeMap} WHERE exam_id = ${examId}

      UNION

      SELECT edge.child_node_id AS id
      FROM ${curriculumEdges} edge
      INNER JOIN reachable r ON r.id = edge.parent_node_id
    )
    SELECT cn.id, cn.node_type AS "nodeType", cn.name, cn.slug, edge.parent_node_id AS "parentId"
    FROM reachable r
    INNER JOIN ${curriculumNodes} cn ON cn.id = r.id
    LEFT JOIN ${curriculumEdges} edge ON edge.child_node_id = cn.id AND edge.parent_node_id IN (SELECT id FROM reachable)
  `)) as unknown as [DescendantRow[], unknown];

  const byId = new Map<string, SyllabusNode>();
  const roots: SyllabusNode[] = [];

  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, { id: row.id, nodeType: row.nodeType, name: row.name, slug: row.slug, children: [] });
    }
  }
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentId && byId.has(row.parentId)) {
      byId.get(row.parentId)!.children.push(node);
    } else if (!row.parentId) {
      roots.push(node);
    }
  }

  return roots;
}

export const taxonomyRepository = {
  listPrograms,
  findProgramBySlug,
  findProgramById,
  createProgram,
  updateProgram,
  listExams,
  listPublicExams,
  findExamBySlug,
  findExamById,
  createExam,
  updateExam,
  listNodes,
  listNodesWithParents,
  findNodeBySlug,
  findNodeById,
  createNode,
  updateNode,
  attachNodeToExam,
  detachNodeFromExam,
  listNodeIdsForExam,
  setExamNodes,
  getNodeParentIds,
  setNodeParents,
  getSyllabusTree,
};
