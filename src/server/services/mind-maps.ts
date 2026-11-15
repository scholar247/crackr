import { cache } from 'react';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { blogsPath } from '@/server/services/blog-browse';
import { isDuplicateKeyError } from '@/server/db/helpers';
import {
  buildTree,
  countNodes,
  diffMindMaps,
  generateFromCurriculum,
  flattenTree,
  isMindMapExam,
  nextMindMapStatus,
  subjectSegment,
  validateFlatTree,
  walkTree,
  type CurriculumSource,
  type MindMapAction,
  type MindMapSnapshot,
  type MindMapTreeNode,
} from '@/lib/mind-maps';
import type { SaveMindMapInput } from '@/schemas/mind-map.schema';

type Exam = { id: string; slug: string };

// ── Curriculum lookups ─────────────────────────────────────────────────────────

/** Subject + chapter for a chapter node in an exam's syllabus, or null if it isn't one. */
export function findChapter(syllabus: SyllabusNode[], chapterNodeId: string) {
  for (const subject of syllabus) {
    const chapter = subject.children.find((c) => c.id === chapterNodeId && c.nodeType === 'CHAPTER');
    if (chapter) return { subject, chapter };
  }
  return null;
}

/** Ancestor trail (subject → … → node) for a node inside a chapter. */
function trailTo(subject: SyllabusNode, chapter: SyllabusNode, nodeId: string): SyllabusNode[] | null {
  const search = (n: SyllabusNode, path: SyllabusNode[]): SyllabusNode[] | null => {
    if (n.id === nodeId) return [...path, n];
    for (const c of n.children) {
      const found = search(c, [...path, n]);
      if (found) return found;
    }
    return null;
  };
  return search(chapter, [subject]);
}

function collectIds(n: SyllabusNode, out = new Set<string>()) {
  for (const c of n.children) {
    out.add(c.id);
    collectIds(c, out);
  }
  return out;
}

/** The chapter's subtree with curriculum descriptions — input for generation and linking. */
async function chapterSource(chapter: SyllabusNode): Promise<CurriculumSource> {
  const ids = [...collectIds(chapter)];
  const descriptions = await mindMapRepository.curriculumDescriptions(ids);
  const convert = (n: SyllabusNode): CurriculumSource => ({
    id: n.id,
    name: n.name,
    nodeType: n.nodeType,
    description: descriptions.get(n.id) ?? null,
    children: n.children.map(convert),
  });
  return convert(chapter);
}

/** Practice browser deep link for a curriculum trail (subject, chapter, topic, subtopic). */
function practiceHref(examSlug: string, trail: SyllabusNode[]) {
  const keys = ['subject', 'chapter', 'topic', 'subtopic'];
  const params = new URLSearchParams();
  trail.slice(0, keys.length).forEach((n, i) => params.set(keys[i], n.id));
  return `/practice/exams/${examSlug}/questions?${params}`;
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export type ServiceError = { ok: false; status: 400 | 404 | 409; error: string };

/** Exams that can have mind maps, each with its syllabus (for the create picker). */
export async function listEligibleExams() {
  const rows = await taxonomyRepository.listPublicExams();
  const eligible = rows.map((r) => r.exam).filter((e) => isMindMapExam(e.slug));
  return Promise.all(eligible.map(async (e) => ({ id: e.id, name: e.name, slug: e.slug, syllabus: await taxonomyRepository.getSyllabusTree(e.id) })));
}

export async function createMindMap(examId: string, chapterNodeId: string, userId: string | null): Promise<{ ok: true; id: string } | ServiceError> {
  const exam = await taxonomyRepository.findExamById(examId);
  if (!exam || exam.status !== 'ACTIVE' || !isMindMapExam(exam.slug)) return { ok: false, status: 400, error: 'Mind maps are not enabled for this exam' };

  const found = findChapter(await taxonomyRepository.getSyllabusTree(exam.id), chapterNodeId);
  if (!found) return { ok: false, status: 400, error: "That chapter isn't part of this exam's syllabus" };

  const nodes = flattenTree(generateFromCurriculum(await chapterSource(found.chapter)));
  try {
    return { ok: true, id: await mindMapRepository.create({ examId, chapterNodeId, nodes, createdBy: userId }) };
  } catch (err) {
    if (isDuplicateKeyError(err)) return { ok: false, status: 409, error: 'This chapter already has a mind map' };
    throw err;
  }
}

/** Everything the editor needs: draft, the chapter's curriculum and the diff against live. */
export async function getEditorData(id: string) {
  const map = await mindMapRepository.findById(id);
  if (!map) return null;
  const exam = await taxonomyRepository.findExamById(map.examId);
  if (!exam) return null;
  const found = findChapter(await taxonomyRepository.getSyllabusTree(exam.id), map.chapterNodeId);
  const nodes = await mindMapRepository.listNodes(id);
  const tree = buildTree(nodes);
  return {
    map: { ...map, publishedSnapshot: undefined },
    exam: { id: exam.id, name: exam.name, slug: exam.slug },
    subject: found ? { id: found.subject.id, name: found.subject.name, slug: found.subject.slug } : null,
    chapter: found ? { id: found.chapter.id, name: found.chapter.name, slug: found.chapter.slug } : null,
    curriculum: found ? await chapterSource(found.chapter) : null,
    nodes,
    /** Live version's tree, so the editor can diff unsaved edits against it. */
    publishedNodes: map.publishedSnapshot?.nodes ?? null,
    diff: diffMindMaps(map.publishedSnapshot?.nodes ?? null, tree),
    publicPath: found ? `/exams/${exam.slug}/mind-maps/${subjectSegment(found.subject.slug)}/${found.chapter.slug}` : null,
  };
}

export async function saveMindMap(id: string, input: SaveMindMapInput, userId: string | null): Promise<{ ok: true } | ServiceError> {
  const map = await mindMapRepository.findById(id);
  if (!map) return { ok: false, status: 404, error: 'Not found' };
  if (map.status === 'ARCHIVED') return { ok: false, status: 409, error: 'Restore this mind map before editing it' };

  const found = findChapter(await taxonomyRepository.getSyllabusTree(map.examId), map.chapterNodeId);
  if (!found) return { ok: false, status: 409, error: "This chapter is no longer in the exam's syllabus" };

  const problem = validateFlatTree(input.nodes, collectIds(found.chapter));
  if (problem) return { ok: false, status: 400, error: problem };

  await mindMapRepository.saveDraft(id, input, userId);
  return { ok: true };
}

export async function changeMindMapStatus(id: string, action: MindMapAction, userId: string | null): Promise<{ ok: true; status: string } | ServiceError> {
  const map = await mindMapRepository.findById(id);
  if (!map) return { ok: false, status: 404, error: 'Not found' };
  const next = nextMindMapStatus(map.status, action);
  if (!next) return { ok: false, status: 409, error: `Can't ${action} a mind map that is ${map.status.toLowerCase().replace('_', ' ')}` };

  if (action === 'publish') {
    const nodes = buildTree(await mindMapRepository.listNodes(id));
    if (nodes.length === 0) return { ok: false, status: 400, error: 'Add at least one topic before publishing' };
    const snapshot: MindMapSnapshot = {
      version: 1,
      seoTitle: map.seoTitle,
      seoDescription: map.seoDescription,
      intro: map.intro,
      revisionNotes: map.revisionNotes,
      faqs: map.faqs ?? [],
      nodes,
    };
    await mindMapRepository.setStatus(id, next, userId, snapshot);
  } else {
    await mindMapRepository.setStatus(id, next, userId);
  }
  return { ok: true, status: next };
}

// ── Public ─────────────────────────────────────────────────────────────────────

export interface NodeResources {
  mcqs: number;
  pyqs: number;
  notes: number;
  practiceHref: string | null;
  notesHref: string | null;
}

/**
 * Published maps for an exam, grouped by subject in syllabus order. Only chapters with a
 * published map are listed; `totalChapters` lets pages say "4 of 6 chapters" honestly.
 * Memoised per request on primitive keys, so metadata and page share one round trip.
 */
const loadIndex = cache(async (examId: string, examSlug: string) => {
  if (!isMindMapExam(examSlug)) return [];
  const [syllabus, published] = await Promise.all([taxonomyRepository.getSyllabusTree(examId), mindMapRepository.listPublishedByExam(examId)]);
  const byChapter = new Map(published.map((p) => [p.chapterNodeId, p]));
  return syllabus
    .map((subject) => {
      const chapters = subject.children.filter((c) => c.nodeType === 'CHAPTER');
      return {
        subject: { id: subject.id, name: subject.name, slug: subject.slug, segment: subjectSegment(subject.slug) },
        totalChapters: chapters.length,
        chapters: chapters.flatMap((c) => {
          const p = byChapter.get(c.id);
          return p ? [{ id: c.id, name: c.name, slug: c.slug, topicCount: p.topicCount, intro: p.intro, publishedAt: p.publishedAt }] : [];
        }),
      };
    })
    .filter((s) => s.chapters.length > 0 || s.totalChapters > 0);
});

export const loadMindMapIndex = (exam: Exam) => loadIndex(exam.id, exam.slug);

export type MindMapIndex = Awaited<ReturnType<typeof loadIndex>>;

/** A published chapter map with live MCQ/PYQ/notes counts and links per node, or null (→ 404). */
export const loadChapterMindMap = (exam: Exam, segment: string, chapterSlug: string) => loadChapter(exam.id, exam.slug, segment, chapterSlug);

const loadChapter = cache(async (examId: string, examSlug: string, segment: string, chapterSlug: string) => {
  const exam = { id: examId, slug: examSlug };
  if (!isMindMapExam(exam.slug)) return null;
  const syllabus = await taxonomyRepository.getSyllabusTree(exam.id);
  const subject = syllabus.find((s) => subjectSegment(s.slug) === segment);
  const chapter = subject?.children.find((c) => c.nodeType === 'CHAPTER' && c.slug === chapterSlug);
  if (!subject || !chapter) return null;

  const [published, index] = await Promise.all([mindMapRepository.findPublished(exam.id, chapter.id), loadMindMapIndex(exam)]);
  if (!published) return null;
  const { snapshot } = published;

  // Live resource counts for the chapter and every linked topic/subtopic.
  const linked = new Set<string>([chapter.id]);
  walkTree(snapshot.nodes, (n) => {
    if (n.curriculumNodeId) linked.add(n.curriculumNodeId);
  });
  const ids = [...linked];
  const [mcqs, pyqs, notes] = await Promise.all([
    questionRepository.countPublishedByNodes(ids, exam.id),
    questionRepository.countPublishedByNodes(ids, exam.id, { pyqOnly: true }),
    articleRepository.countPublishedByNode(),
  ]);
  const resourcesFor = (curriculumId: string): NodeResources | null => {
    const trail = trailTo(subject, chapter, curriculumId);
    if (!trail) return null; // linked node no longer in this chapter's syllabus
    const n = { mcqs: mcqs.get(curriculumId) ?? 0, pyqs: pyqs.get(curriculumId) ?? 0, notes: notes.get(curriculumId) ?? 0 };
    return { ...n, practiceHref: n.mcqs > 0 ? practiceHref(exam.slug, trail) : null, notesHref: n.notes > 0 ? blogsPath(exam.slug, trail) : null };
  };

  const resources: Record<string, NodeResources> = {};
  walkTree(snapshot.nodes, (n) => {
    const r = n.curriculumNodeId ? resourcesFor(n.curriculumNodeId) : null;
    if (r) resources[n.id] = r;
  });

  // Previous / next published chapter in syllabus order (within the subject).
  const subjectEntry = index.find((s) => s.subject.id === subject.id);
  const siblings = subjectEntry?.chapters ?? [];
  const position = siblings.findIndex((c) => c.id === chapter.id);

  return {
    subject: { id: subject.id, name: subject.name, slug: subject.slug, segment },
    chapter: { id: chapter.id, name: chapter.name, slug: chapter.slug },
    snapshot,
    publishedAt: published.publishedAt,
    nodeCount: countNodes(snapshot.nodes),
    resources,
    chapterResources: resourcesFor(chapter.id)!,
    prev: position > 0 ? siblings[position - 1] : null,
    next: position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null,
  };
});

export type ChapterMindMap = NonNullable<Awaited<ReturnType<typeof loadChapter>>>;

/** Topic names of a map's main branches — used for intros/FAQs built from real data. */
export function topicNames(nodes: MindMapTreeNode[]) {
  return nodes.map((n) => n.label);
}
