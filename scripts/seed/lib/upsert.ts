/**
 * Shared idempotent seeding engine used by every script in scripts/seed/exams/. Follows
 * the same convention as scripts/seed-curriculum-sample.ts (direct drizzle db access,
 * slug-keyed idempotency, insertIgnore around composite-key mapping tables) — every
 * upsert here is safe to re-run.
 */
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { programs, exams, curriculumNodes, curriculumEdges, examNodeMap } from '@/server/db/schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { slugify } from '@/lib/utils';

export type NodeType = 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';

const CHILD_TYPE: Record<NodeType, NodeType | undefined> = {
  SUBJECT: 'CHAPTER',
  CHAPTER: 'TOPIC',
  TOPIC: 'SUBTOPIC',
  SUBTOPIC: undefined,
};

// A subject tree literal: top-level defs passed to seedExamCurriculum are SUBJECT,
// their `children` are CHAPTER, grandchildren TOPIC, great-grandchildren SUBTOPIC —
// depth is implied by nesting, matching curriculum_nodes.node_type's fixed 4-level enum.
export interface NodeDef {
  name: string;
  description?: string;
  children?: NodeDef[];
}

export interface ExamSeedInput {
  programName: string;
  programDescription?: string;
  examName: string;
  examDescription?: string;
  subjects: NodeDef[];
}

async function insertIgnore(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}

async function upsertProgram(name: string, description?: string) {
  const slug = slugify(name);
  const [existing] = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  if (existing) return existing;
  await db.insert(programs).values({ id: randomUUID(), name, slug, description });
  const [row] = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  return row;
}

async function upsertExam(programId: string, name: string, description?: string) {
  const slug = slugify(name);
  const [existing] = await db.select().from(exams).where(eq(exams.slug, slug)).limit(1);
  if (existing) return existing;
  await db.insert(exams).values({ id: randomUUID(), programId, name, slug, description });
  const [row] = await db.select().from(exams).where(eq(exams.slug, slug)).limit(1);
  return row;
}

// Nodes are global (per the ERD's "one Mathematics row, mapped to many exams" design) —
// re-running a different exam's script against an already-seeded shared subject just
// finds it by slug and reuses it, only attaching the new exam's edges/mapping.
async function upsertNode(nodeType: NodeType, name: string, description: string | undefined, parentId: string | undefined) {
  const slug = slugify(name);
  let [node] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1);
  if (!node) {
    await db.insert(curriculumNodes).values({ id: randomUUID(), nodeType, name, slug, description });
    [node] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1);
  }
  if (parentId) {
    // curriculum_edges' composite PK (parentNodeId, childNodeId) already de-duplicates —
    // no need to pre-check, just swallow the conflict.
    await insertIgnore(() => db.insert(curriculumEdges).values({ parentNodeId: parentId, childNodeId: node.id, sortOrder: 0 }));
  }
  return node;
}

async function mapExamNode(examId: string, nodeId: string) {
  await insertIgnore(() => db.insert(examNodeMap).values({ examId, nodeId }));
}

async function upsertTree(def: NodeDef, nodeType: NodeType, parentId: string | undefined): Promise<string> {
  const node = await upsertNode(nodeType, def.name, def.description, parentId);
  if (def.children?.length) {
    const childType = CHILD_TYPE[nodeType];
    if (!childType) throw new Error(`${nodeType} "${def.name}" cannot have children`);
    for (const child of def.children) {
      await upsertTree(child, childType, node.id);
    }
  }
  return node.id;
}

/**
 * Only the subject *roots* go into exam_node_map — getSyllabusTree()'s recursive CTE
 * already walks curriculum_edges outward from whatever's directly mapped, so mapping a
 * subject root automatically pulls in every chapter/topic/subtopic beneath it.
 */
export async function seedExamCurriculum(input: ExamSeedInput) {
  console.log(`Seeding program "${input.programName}"…`);
  const program = await upsertProgram(input.programName, input.programDescription);

  console.log(`Seeding exam "${input.examName}"…`);
  const exam = await upsertExam(program.id, input.examName, input.examDescription);

  console.log(`Seeding curriculum for "${input.examName}" (${input.subjects.length} subjects)…`);
  for (const subject of input.subjects) {
    const subjectId = await upsertTree(subject, 'SUBJECT', undefined);
    await mapExamNode(exam.id, subjectId);
  }

  console.log(`Done: ${input.examName}`);
  return { program, exam };
}

export function runSeed(fn: () => Promise<unknown>) {
  fn()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => process.exit(0));
}
