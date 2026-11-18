// Shared mind-map types and pure logic — no server imports, so the admin editor, public
// pages, API validation and tests all use the same rules.

export const MIND_MAP_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export type MindMapStatus = (typeof MIND_MAP_STATUSES)[number];

export const MIND_MAP_STATUS_LABELS: Record<MindMapStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

/** Limits that keep maps readable and requests bounded. */
export const MIND_MAP_LIMITS = { maxNodes: 400, maxDepth: 6, label: 160, description: 500, content: 20_000 } as const;

export interface MindMapFaq {
  question: string;
  answer: string;
}

/** A node as stored/edited: flat, with a parent pointer and sibling order. */
export interface FlatMindMapNode {
  id: string;
  parentId: string | null;
  curriculumNodeId: string | null;
  label: string;
  description: string | null;
  content: string | null;
  displayOrder: number;
}

/** A node as rendered: nested. */
export interface MindMapTreeNode {
  id: string;
  label: string;
  description: string | null;
  content: string | null;
  curriculumNodeId: string | null;
  children: MindMapTreeNode[];
}

/** Frozen copy of a map at publish time — the only thing public pages read. */
export interface MindMapSnapshot {
  version: 1;
  seoTitle: string | null;
  seoDescription: string | null;
  intro: string | null;
  revisionNotes: string | null;
  faqs: MindMapFaq[];
  nodes: MindMapTreeNode[];
}

// ── Status workflow ────────────────────────────────────────────────────────────

export const MIND_MAP_ACTIONS = ['submit', 'return', 'publish', 'unpublish', 'archive', 'restore'] as const;
export type MindMapAction = (typeof MIND_MAP_ACTIONS)[number];

const TRANSITIONS: Record<MindMapAction, { from: MindMapStatus[]; to: MindMapStatus }> = {
  submit: { from: ['DRAFT'], to: 'IN_REVIEW' },
  return: { from: ['IN_REVIEW'], to: 'DRAFT' },
  // Publishing again from PUBLISHED pushes pending draft changes live.
  publish: { from: ['DRAFT', 'IN_REVIEW', 'PUBLISHED'], to: 'PUBLISHED' },
  unpublish: { from: ['PUBLISHED'], to: 'DRAFT' },
  archive: { from: ['DRAFT', 'IN_REVIEW', 'PUBLISHED'], to: 'ARCHIVED' },
  restore: { from: ['ARCHIVED'], to: 'DRAFT' },
};

/** The status an action leads to, or null if it isn't allowed from `current`. */
export function nextMindMapStatus(current: MindMapStatus, action: MindMapAction): MindMapStatus | null {
  const t = TRANSITIONS[action];
  return t.from.includes(current) ? t.to : null;
}

export function allowedMindMapActions(current: MindMapStatus): MindMapAction[] {
  return MIND_MAP_ACTIONS.filter((a) => nextMindMapStatus(current, a) !== null);
}

// ── Tree helpers ───────────────────────────────────────────────────────────────

/** Flat rows → nested tree, siblings by displayOrder. Rows with a missing parent become roots. */
export function buildTree(rows: FlatMindMapNode[]): MindMapTreeNode[] {
  const byId = new Map<string, MindMapTreeNode & { order: number; parentId: string | null }>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      label: r.label,
      description: r.description,
      content: r.content,
      curriculumNodeId: r.curriculumNodeId,
      children: [],
      order: r.displayOrder,
      parentId: r.parentId,
    });
  }
  const roots: (MindMapTreeNode & { order: number })[] = [];
  for (const n of byId.values()) {
    const parent = n.parentId ? byId.get(n.parentId) : undefined;
    (parent ? parent.children : roots).push(n);
  }
  const strip = (nodes: (MindMapTreeNode & { order?: number })[]): MindMapTreeNode[] =>
    [...nodes]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(({ id, label, description, content, curriculumNodeId, children }) => ({
        id,
        label,
        description,
        content,
        curriculumNodeId,
        children: strip(children as (MindMapTreeNode & { order?: number })[]),
      }));
  return strip(roots);
}

/** Nested tree → flat rows (parents before children, displayOrder = sibling index). */
export function flattenTree(nodes: MindMapTreeNode[], parentId: string | null = null, out: FlatMindMapNode[] = []): FlatMindMapNode[] {
  nodes.forEach((n, i) => {
    out.push({ id: n.id, parentId, curriculumNodeId: n.curriculumNodeId, label: n.label, description: n.description, content: n.content, displayOrder: i });
    flattenTree(n.children, n.id, out);
  });
  return out;
}

export function countNodes(nodes: MindMapTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

export function treeDepth(nodes: MindMapTreeNode[]): number {
  return nodes.reduce((max, n) => Math.max(max, 1 + treeDepth(n.children)), 0);
}

export function walkTree(nodes: MindMapTreeNode[], visit: (node: MindMapTreeNode, ancestors: MindMapTreeNode[]) => void, ancestors: MindMapTreeNode[] = []) {
  for (const n of nodes) {
    visit(n, ancestors);
    walkTree(n.children, visit, [...ancestors, n]);
  }
}

/** Curriculum subtree shape used for generation (matches SyllabusNode + optional description). */
export interface CurriculumSource {
  id: string;
  name: string;
  nodeType: string;
  description?: string | null;
  children: CurriculumSource[];
}

/**
 * Initial map for a chapter, straight from the existing curriculum: each topic becomes a
 * main branch and each subtopic (at any depth) a child, keeping curriculum ids and order.
 * Descriptions come from the curriculum's own description field when present — nothing is
 * invented. `makeId` is injectable for deterministic tests.
 */
export function generateFromCurriculum(chapter: CurriculumSource, makeId: () => string = () => crypto.randomUUID()): MindMapTreeNode[] {
  const convert = (n: CurriculumSource): MindMapTreeNode => ({
    id: makeId(),
    label: n.name.slice(0, MIND_MAP_LIMITS.label),
    description: n.description ? n.description.slice(0, MIND_MAP_LIMITS.description) : null,
    content: null,
    curriculumNodeId: n.id,
    children: n.children.map(convert),
  });
  return chapter.children.map(convert);
}

/**
 * Curriculum items under the chapter that the map doesn't reference yet — for the editor's
 * "add missing curriculum items". Each comes with the curriculum id of its parent so it can
 * be placed under the node that already represents that parent.
 */
export function missingCurriculumItems(chapter: CurriculumSource, nodes: MindMapTreeNode[]) {
  const linked = new Set<string>();
  walkTree(nodes, (n) => {
    if (n.curriculumNodeId) linked.add(n.curriculumNodeId);
  });
  const missing: { item: CurriculumSource; parentCurriculumId: string | null }[] = [];
  const visit = (n: CurriculumSource, parentId: string | null) => {
    if (!linked.has(n.id)) missing.push({ item: n, parentCurriculumId: parentId });
    for (const c of n.children) visit(c, n.id);
  };
  for (const c of chapter.children) visit(c, null);
  return missing;
}

// ── Review: what changed since the published version ───────────────────────────

export interface MindMapDiff {
  added: string[];
  removed: string[];
  renamed: { from: string; to: string }[];
  moved: string[];
  descriptionsChanged: string[];
  contentChanged: string[];
  hasChanges: boolean;
}

type DiffIndex = Map<string, { node: MindMapTreeNode; parentId: string | null; position: number }>;

/**
 * A node's position among the siblings that exist (under the same parent) in both versions —
 * so inserting, removing or moving one node doesn't report its siblings as "moved".
 */
function relativeIndex(index: DiffIndex, parentId: string | null, id: string, other: DiffIndex): number {
  return [...index.entries()]
    .filter(([sid, e]) => e.parentId === parentId && other.get(sid)?.parentId === parentId)
    .sort((x, y) => x[1].position - y[1].position)
    .findIndex(([sid]) => sid === id);
}

export function diffMindMaps(published: MindMapTreeNode[] | null, draft: MindMapTreeNode[]): MindMapDiff {
  const index = (nodes: MindMapTreeNode[]) => {
    const m = new Map<string, { node: MindMapTreeNode; parentId: string | null; position: number }>();
    walkTree(nodes, (n, ancestors) => {
      const parent = ancestors[ancestors.length - 1] ?? null;
      const siblings = parent ? parent.children : nodes;
      m.set(n.id, { node: n, parentId: parent?.id ?? null, position: siblings.indexOf(n) });
    });
    return m;
  };
  const before = index(published ?? []);
  const after = index(draft);
  const diff: MindMapDiff = { added: [], removed: [], renamed: [], moved: [], descriptionsChanged: [], contentChanged: [], hasChanges: false };

  for (const [id, a] of after) {
    const b = before.get(id);
    if (!b) {
      diff.added.push(a.node.label);
      continue;
    }
    if (b.node.label !== a.node.label) diff.renamed.push({ from: b.node.label, to: a.node.label });
    if (b.parentId !== a.parentId || relativeIndex(before, b.parentId, id, after) !== relativeIndex(after, a.parentId, id, before)) diff.moved.push(a.node.label);
    if ((b.node.description ?? '') !== (a.node.description ?? '')) diff.descriptionsChanged.push(a.node.label);
    if ((b.node.content ?? '') !== (a.node.content ?? '')) diff.contentChanged.push(a.node.label);
  }
  for (const [id, b] of before) if (!after.has(id)) diff.removed.push(b.node.label);

  diff.hasChanges = Object.values(diff).some((v) => Array.isArray(v) && v.length > 0);
  return diff;
}

// ── URLs ───────────────────────────────────────────────────────────────────────

/** URL segment for a subject: "science-class-10" → "science" (the class is already in the path). */
export function subjectSegment(subjectSlug: string): string {
  return subjectSlug.replace(/-class-\d+$/, '');
}

export function mindMapsPath(examSlug: string, subjectSlug?: string, chapterSlug?: string): string {
  let path = `/exams/${examSlug}/mind-maps`;
  if (subjectSlug) path += `/${subjectSegment(subjectSlug)}`;
  if (chapterSlug) path += `/${chapterSlug}`;
  return path;
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Structural checks for a submitted flat tree: unique ids, parents that exist, no cycles,
 * size/depth limits, and curriculum links only to nodes inside this chapter. Returns the
 * first problem found, or null if the tree is valid.
 */
export function validateFlatTree(rows: FlatMindMapNode[], allowedCurriculumIds: Set<string>): string | null {
  if (rows.length > MIND_MAP_LIMITS.maxNodes) return `A mind map can have at most ${MIND_MAP_LIMITS.maxNodes} nodes`;
  const byId = new Map<string, FlatMindMapNode>();
  for (const r of rows) {
    if (byId.has(r.id)) return 'Duplicate node id';
    byId.set(r.id, r);
  }
  for (const r of rows) {
    if (!r.label.trim()) return 'Every node needs a label';
    if (r.parentId !== null && !byId.has(r.parentId)) return `Node "${r.label}" has a parent that doesn't exist`;
    if (r.curriculumNodeId && !allowedCurriculumIds.has(r.curriculumNodeId)) return `Node "${r.label}" is linked to a topic outside this chapter`;
    // Walk up to the root: a cycle or an over-deep branch shows up here.
    let depth = 1;
    let cursor = r.parentId;
    const seen = new Set([r.id]);
    while (cursor) {
      if (seen.has(cursor)) return `Node "${r.label}" is its own ancestor`;
      seen.add(cursor);
      depth++;
      if (depth > MIND_MAP_LIMITS.maxDepth) return `Mind maps can be at most ${MIND_MAP_LIMITS.maxDepth} levels deep`;
      cursor = byId.get(cursor)?.parentId ?? null;
    }
  }
  return null;
}

/**
 * Exams with mind maps (the CBSE boards). Only the exam list is fixed here — subjects and
 * chapters are always read from the curriculum.
 */
export const MIND_MAP_EXAM_SLUGS = ['cbse-class-10-board', 'cbse-class-12-board'] as const;

export function isMindMapExam(slug: string): boolean {
  return (MIND_MAP_EXAM_SLUGS as readonly string[]).includes(slug);
}

// ── Sitemap ────────────────────────────────────────────────────────────────────

interface SitemapSubject {
  slug: string;
  nodeType?: string;
  children: { id: string; slug: string; nodeType: string }[];
}

/**
 * Sitemap paths for published mind maps: each chapter page, plus its subject page and the
 * exam's hub — each dated by its newest published chapter. Chapters no longer in the
 * syllabus are skipped (their page would 404), and nothing unpublished is ever listed
 * because callers pass only published rows.
 */
export function mindMapSitemapPaths(
  published: { examSlug: string; chapterNodeId: string; publishedAt: Date }[],
  syllabusByExam: Map<string, SitemapSubject[]>,
): { path: string; lastModified: Date; level: 'hub' | 'subject' | 'chapter' }[] {
  const newest = new Map<string, { lastModified: Date; level: 'hub' | 'subject' | 'chapter' }>();
  const bump = (path: string, at: Date, level: 'hub' | 'subject' | 'chapter') => {
    const prev = newest.get(path);
    if (!prev || at > prev.lastModified) newest.set(path, { lastModified: at, level });
  };
  for (const p of published) {
    const syllabus = syllabusByExam.get(p.examSlug) ?? [];
    const subject = syllabus.find((s) => s.children.some((c) => c.id === p.chapterNodeId && c.nodeType === 'CHAPTER'));
    const chapter = subject?.children.find((c) => c.id === p.chapterNodeId);
    if (!subject || !chapter) continue;
    bump(mindMapsPath(p.examSlug), p.publishedAt, 'hub');
    bump(mindMapsPath(p.examSlug, subject.slug), p.publishedAt, 'subject');
    bump(mindMapsPath(p.examSlug, subject.slug, chapter.slug), p.publishedAt, 'chapter');
  }
  return [...newest].map(([path, v]) => ({ path, ...v }));
}

/** Query param that opens a chapter mind map focused on one topic (by curriculum slug). */
export const MIND_MAP_FOCUS_PARAM = 'focus';

/** Anchor of the interactive map on a chapter page. */
export const MIND_MAP_ANCHOR = 'mind-map';

/**
 * Link that opens a chapter's mind map with a topic expanded, selected and centred — e.g.
 * from the syllabus. The canonical URL stays the plain chapter page.
 */
export function mindMapFocusHref(chapterMindMapHref: string, curriculumSlug: string): string {
  return `${chapterMindMapHref}?${MIND_MAP_FOCUS_PARAM}=${encodeURIComponent(curriculumSlug)}#${MIND_MAP_ANCHOR}`;
}
