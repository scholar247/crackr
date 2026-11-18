/**
 * Detailed CBSE Class 10 & 12 chapter mind maps (data/cbse-mind-map-content.ts).
 *
 * Run: npm run seed:cbse-mind-maps
 *
 * For each chapter it builds a map whose points link to the chapter's existing curriculum
 * topics where named (`link`), with editor-written facts as custom nodes — the curriculum
 * itself is never changed (Class 12 chapters are shared with other exams).
 *
 * Idempotent and conservative:
 * - no map yet → create and publish (version saved in history);
 * - a map that is still the untouched names-only seed (every node linked to the
 *   curriculum, no descriptions, content, styles, tags or Hindi) → replaced and republished;
 * - any other existing map has been edited by someone → left unchanged.
 */
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { mindMaps } from '@/server/db/schema';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { flattenTree, validateFlatTree, type MindMapSnapshot, type MindMapTreeNode } from '@/lib/mind-maps';
import { runSeed } from '../lib/upsert';
import { CBSE_MIND_MAPS, type Point } from '../data/cbse-mind-map-content';

function descendants(n: SyllabusNode, out: SyllabusNode[] = []) {
  for (const c of n.children) {
    out.push(c);
    descendants(c, out);
  }
  return out;
}

function build(points: Point[], byName: Map<string, string>, missing: string[]): MindMapTreeNode[] {
  return points.map((p) => {
    const spec = typeof p === 'string' ? { l: p } : p;
    let curriculumNodeId: string | null = null;
    if (spec.link) {
      curriculumNodeId = byName.get(spec.link.toLowerCase()) ?? null;
      if (!curriculumNodeId) missing.push(spec.link);
    }
    const style = spec.h || spec.dash || spec.mark ? { ...(spec.h ? { heading: true } : {}), ...(spec.dash ? { border: 'dashed' as const } : {}), ...(spec.mark ? { highlight: true } : {}) } : null;
    return {
      id: randomUUID(),
      label: spec.l,
      description: spec.d ?? null,
      content: null,
      curriculumNodeId,
      style,
      tags: spec.tags ?? null,
      labelHi: null,
      children: build(spec.c ?? [], byName, missing),
    };
  });
}

/** Still exactly what the names-only seed produced — nobody has edited it. */
function isPristineSeed(rows: Awaited<ReturnType<typeof mindMapRepository.listNodes>>) {
  return rows.length > 0 && rows.every((r) => r.curriculumNodeId && !r.description && !r.content && !r.style && !r.tags && !r.labelHi);
}

runSeed(async () => {
  let created = 0;
  let refreshed = 0;
  let skipped = 0;
  const syllabi = new Map<string, { examId: string; tree: SyllabusNode[] }>();

  for (const spec of CBSE_MIND_MAPS) {
    let entry = syllabi.get(spec.exam);
    if (!entry) {
      const exam = await taxonomyRepository.findExamBySlug(spec.exam);
      if (!exam) throw new Error(`Exam ${spec.exam} not found`);
      entry = { examId: exam.id, tree: await taxonomyRepository.getSyllabusTree(exam.id) };
      syllabi.set(spec.exam, entry);
    }
    const label = `${spec.exam.replace('cbse-', '')} · ${spec.chapter}`;
    const subject = entry.tree.find((s) => s.slug === spec.subject);
    const chapter = subject?.children.find((c) => c.nodeType === 'CHAPTER' && c.name === spec.chapter);
    if (!chapter) {
      console.warn(`  ! ${label}: chapter not found under ${spec.subject}, skipped`);
      continue;
    }

    const inChapter = descendants(chapter);
    const byName = new Map(inChapter.map((n) => [n.name.toLowerCase(), n.id]));
    const missing: string[] = [];
    const tree = build(spec.nodes, byName, missing);
    if (missing.length) console.warn(`    ${label}: no curriculum topic named ${missing.map((m) => `"${m}"`).join(', ')} — kept as custom nodes`);

    const nodes = flattenTree(tree);
    const problem = validateFlatTree(nodes, new Set(inChapter.map((n) => n.id)));
    if (problem) throw new Error(`${label}: ${problem}`);
    const snapshot: MindMapSnapshot = { version: 1, seoTitle: null, seoDescription: null, intro: null, revisionNotes: null, faqs: [], nodes: tree, theme: 'COLOUR' };

    const [existing] = await db
      .select({ id: mindMaps.id })
      .from(mindMaps)
      .where(and(eq(mindMaps.examId, entry.examId), eq(mindMaps.chapterNodeId, chapter.id)))
      .limit(1);

    if (!existing) {
      const id = await mindMapRepository.create({ examId: entry.examId, chapterNodeId: chapter.id, nodes, createdBy: DEFAULT_CONTENT_AUTHOR_ID });
      await mindMapRepository.setStatus(id, 'PUBLISHED', DEFAULT_CONTENT_AUTHOR_ID, snapshot);
      console.log(`  + ${label}: published (${nodes.length} nodes)`);
      created++;
    } else if (isPristineSeed(await mindMapRepository.listNodes(existing.id))) {
      const rows = nodes.map((n) => ({ ...n, labelHi: n.labelHi ?? null, style: n.style ?? null, tags: n.tags ?? null }));
      await mindMapRepository.saveDraft(existing.id, { seoTitle: null, seoDescription: null, intro: null, revisionNotes: null, faqs: [], nodes: rows, theme: 'COLOUR' }, DEFAULT_CONTENT_AUTHOR_ID);
      await mindMapRepository.setStatus(existing.id, 'PUBLISHED', DEFAULT_CONTENT_AUTHOR_ID, snapshot);
      console.log(`  ↻ ${label}: names-only seed replaced with the detailed map (${nodes.length} nodes)`);
      refreshed++;
    } else {
      console.log(`  – ${label}: already edited, left unchanged`);
      skipped++;
    }
  }
  console.log(`\nDone: ${created} created, ${refreshed} refreshed, ${skipped} unchanged.`);
});
