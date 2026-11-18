/**
 * Sample CBSE Class 10 mind maps.
 *
 * Run: npm run seed:cbse-10-mind-maps
 *
 * 1. Adds the NCERT topic/subtopic structure for a few Class 10 chapters to the curriculum
 *    (data/cbse-class-10-topics.ts) — names only, in textbook order.
 * 2. Generates a mind map for each of those chapters from that structure and publishes it.
 *
 * Idempotent and conservative:
 * - curriculum nodes are global and keyed by slug, so a topic whose slug already exists
 *   with a *different* parent stops the script instead of being shared (that would pull
 *   another exam's subtree into Class 10, or this one into theirs);
 * - a chapter that already has a mind map is skipped, so admin edits are never overwritten.
 */
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { curriculumEdges, curriculumNodes } from '@/server/db/schema';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { flattenTree, validateFlatTree, type MindMapSnapshot, type MindMapTreeNode } from '@/lib/mind-maps';
import { slugify } from '@/lib/utils';
import { runSeed, type NodeDef, type NodeType } from '../lib/upsert';
import { CBSE_CLASS_10_TOPICS } from '../data/cbse-class-10-topics';

const EXAM_SLUG = 'cbse-class-10-board';

/** "Nutrition (Life Processes)" → "Nutrition": the suffix only keeps curriculum slugs unique. */
const displayLabel = (name: string) => name.replace(/\s*\((Life Processes|Class 10)\)$/, '');

async function findNode(slug: string) {
  const [node] = await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1);
  return node ?? null;
}

async function parentsOf(nodeId: string) {
  return db.select({ parentId: curriculumEdges.parentNodeId }).from(curriculumEdges).where(eq(curriculumEdges.childNodeId, nodeId));
}

/** Upserts one topic/subtopic under `parentId`, refusing to share a node owned elsewhere. */
async function upsertChild(def: NodeDef, nodeType: NodeType, parentId: string, sortOrder: number): Promise<string> {
  const slug = slugify(def.name);
  let node = await findNode(slug);
  if (node) {
    const parents = await parentsOf(node.id);
    if (parents.some((p) => p.parentId !== parentId)) {
      throw new Error(`"${def.name}" (slug ${slug}) already exists under another parent — rename it in cbse-class-10-topics.ts rather than sharing it.`);
    }
  } else {
    const id = randomUUID();
    await db.insert(curriculumNodes).values({ id, nodeType, name: def.name, slug, description: def.description ?? null });
    node = (await findNode(slug))!;
  }
  const [edge] = await db
    .select()
    .from(curriculumEdges)
    .where(and(eq(curriculumEdges.parentNodeId, parentId), eq(curriculumEdges.childNodeId, node.id)))
    .limit(1);
  if (!edge) await db.insert(curriculumEdges).values({ parentNodeId: parentId, childNodeId: node.id, sortOrder });
  else if (edge.sortOrder !== sortOrder) await db.update(curriculumEdges).set({ sortOrder }).where(and(eq(curriculumEdges.parentNodeId, parentId), eq(curriculumEdges.childNodeId, node.id)));
  return node.id;
}

/** Adds the topic tree under a chapter and returns the matching mind-map tree (NCERT order). */
async function seedTopics(defs: NodeDef[], parentId: string, depth: number): Promise<MindMapTreeNode[]> {
  const out: MindMapTreeNode[] = [];
  for (const [i, def] of defs.entries()) {
    const id = await upsertChild(def, depth === 0 ? 'TOPIC' : 'SUBTOPIC', parentId, i);
    out.push({
      id: randomUUID(),
      label: displayLabel(def.name),
      description: null,
      content: null,
      curriculumNodeId: id,
      children: await seedTopics(def.children ?? [], id, depth + 1),
    });
  }
  return out;
}

function descendantIds(n: SyllabusNode, out = new Set<string>()) {
  for (const c of n.children) {
    out.add(c.id);
    descendantIds(c, out);
  }
  return out;
}

runSeed(async () => {
  const exam = await taxonomyRepository.findExamBySlug(EXAM_SLUG);
  if (!exam) throw new Error(`Exam ${EXAM_SLUG} not found — run npm run seed:cbse-10 first`);
  const existing = new Set((await mindMapRepository.listChapterIds([exam.id])).map((m) => m.chapterNodeId));

  for (const [chapterName, defs] of Object.entries(CBSE_CLASS_10_TOPICS)) {
    // The chapter must already be a Class 10 chapter in the syllabus.
    const before = await taxonomyRepository.getSyllabusTree(exam.id);
    const chapter = before.flatMap((s) => s.children).find((c) => c.slug === slugify(chapterName) && c.nodeType === 'CHAPTER');
    if (!chapter) {
      console.warn(`  ! ${chapterName}: not a chapter in ${EXAM_SLUG}, skipped`);
      continue;
    }

    const tree = await seedTopics(defs, chapter.id, 0);
    console.log(`  ✓ ${chapterName}: curriculum topics in place`);

    if (existing.has(chapter.id)) {
      console.log(`    – mind map already exists, left unchanged`);
      continue;
    }

    // Validate against the chapter's real (now updated) subtree before creating anything.
    const after = (await taxonomyRepository.getSyllabusTree(exam.id)).flatMap((s) => s.children).find((c) => c.id === chapter.id)!;
    const nodes = flattenTree(tree);
    const problem = validateFlatTree(nodes, descendantIds(after));
    if (problem) throw new Error(`${chapterName}: ${problem}`);

    const id = await mindMapRepository.create({ examId: exam.id, chapterNodeId: chapter.id, nodes, createdBy: DEFAULT_CONTENT_AUTHOR_ID });
    const snapshot: MindMapSnapshot = { version: 1, seoTitle: null, seoDescription: null, intro: null, revisionNotes: null, faqs: [], nodes: tree };
    await mindMapRepository.setStatus(id, 'PUBLISHED', DEFAULT_CONTENT_AUTHOR_ID, snapshot);
    console.log(`    + mind map published (${nodes.length} nodes)`);
  }
});
