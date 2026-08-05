import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { programs, exams, curriculumNodes, curriculumEdges, examNodeMap } from '@/server/db/schema';
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

async function createProgram(input: { name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(input.name), findProgramBySlug);
  const [row] = await db.insert(programs).values({ name: input.name, slug, description: input.description }).returning();
  return row;
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

async function createExam(input: { programId: string; name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(input.name), findExamBySlug);
  const [row] = await db
    .insert(exams)
    .values({ programId: input.programId, name: input.name, slug, description: input.description })
    .returning();
  return row;
}

// ── Curriculum nodes ────────────────────────────────────────────────────────

async function listNodes() {
  return db.select().from(curriculumNodes).orderBy(asc(curriculumNodes.name));
}

async function findNodeBySlug(slug: string) {
  const [row] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1);
  return row ?? null;
}

async function createNode(input: {
  nodeType: 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';
  name: string;
  parentNodeId?: string;
  examId?: string;
}) {
  const slug = await ensureUniqueSlug(slugify(input.name), findNodeBySlug);
  const [node] = await db.insert(curriculumNodes).values({ nodeType: input.nodeType, name: input.name, slug }).returning();

  if (input.parentNodeId) {
    await db.insert(curriculumEdges).values({ parentNodeId: input.parentNodeId, childNodeId: node.id, sortOrder: 0 });
  }
  if (input.examId) {
    await db.insert(examNodeMap).values({ examId: input.examId, nodeId: node.id }).onConflictDoNothing();
  }

  return node;
}

async function attachNodeToExam(examId: string, nodeId: string) {
  await db.insert(examNodeMap).values({ examId, nodeId }).onConflictDoNothing();
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
  const rows = await db.execute<DescendantRow>(sql`
    WITH RECURSIVE descendants AS (
      SELECT cn.id, cn.node_type, cn.name, cn.slug, NULL::uuid AS parent_id
      FROM ${curriculumNodes} cn
      INNER JOIN ${examNodeMap} enm ON enm.node_id = cn.id
      WHERE enm.exam_id = ${examId}

      UNION ALL

      SELECT child.id, child.node_type, child.name, child.slug, edge.parent_node_id AS parent_id
      FROM ${curriculumEdges} edge
      INNER JOIN ${curriculumNodes} child ON child.id = edge.child_node_id
      INNER JOIN descendants d ON d.id = edge.parent_node_id
    )
    SELECT id, node_type AS "nodeType", name, slug, parent_id AS "parentId" FROM descendants
  `);

  const byId = new Map<string, SyllabusNode>();
  const roots: SyllabusNode[] = [];

  for (const row of rows) {
    byId.set(row.id, { id: row.id, nodeType: row.nodeType, name: row.name, slug: row.slug, children: [] });
  }
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentId && byId.has(row.parentId)) {
      byId.get(row.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export const taxonomyRepository = {
  listPrograms,
  findProgramBySlug,
  createProgram,
  listExams,
  listPublicExams,
  findExamBySlug,
  createExam,
  listNodes,
  findNodeBySlug,
  createNode,
  attachNodeToExam,
  getSyllabusTree,
};
