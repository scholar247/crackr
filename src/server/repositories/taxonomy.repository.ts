import { asc, eq, sql } from 'drizzle-orm';
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

async function createProgram(input: { name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(input.name), findProgramBySlug);
  const id = randomUUID();
  await db.insert(programs).values({ id, name: input.name, slug, description: input.description });
  return findProgramBySlug(slug);
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
  const id = randomUUID();
  await db.insert(exams).values({ id, programId: input.programId, name: input.name, slug, description: input.description });
  return findExamBySlug(slug);
}

// ── Curriculum nodes ────────────────────────────────────────────────────────

async function listNodes() {
  return db.select().from(curriculumNodes).orderBy(asc(curriculumNodes.name));
}

async function findNodeBySlug(slug: string) {
  const [row] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1);
  return row ?? null;
}

async function attachNodeToExam(examId: string, nodeId: string) {
  try {
    await db.insert(examNodeMap).values({ examId, nodeId });
  } catch (err) {
    // Emulates ON CONFLICT DO NOTHING — examNodeMap's (examId, nodeId) composite primary
    // key already prevents duplicates; a re-attach attempt is a harmless no-op.
    if (!isDuplicateKeyError(err)) throw err;
  }
}

async function createNode(input: {
  nodeType: 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';
  name: string;
  parentNodeId?: string;
  examId?: string;
}) {
  const slug = await ensureUniqueSlug(slugify(input.name), findNodeBySlug);
  const id = randomUUID();
  await db.insert(curriculumNodes).values({ id, nodeType: input.nodeType, name: input.name, slug });

  if (input.parentNodeId) {
    await db.insert(curriculumEdges).values({ parentNodeId: input.parentNodeId, childNodeId: id, sortOrder: 0 });
  }
  if (input.examId) {
    await attachNodeToExam(input.examId, id);
  }

  return findNodeBySlug(slug);
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
  // parent is then resolved separately via curriculum_edges, so a node that's both
  // directly mapped and reachable through an ancestor still nests exactly once, in its
  // real tree position — not as a duplicate phantom root.
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
    LEFT JOIN ${curriculumEdges} edge ON edge.child_node_id = cn.id
  `)) as unknown as [DescendantRow[], unknown];

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
