import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';

export const BLOGS_PAGE_SIZE = 10;

const NODE_TYPE_LABELS: Record<string, string> = {
  SUBJECT: 'Subjects',
  CHAPTER: 'Chapters',
  TOPIC: 'Topics',
  SUBTOPIC: 'Subtopics',
};

/** URL segment for a node's level — `subject`, `chapter`, `topic`, `subtopic`. */
export function nodeSegment(node: Pick<SyllabusNode, 'nodeType'>) {
  return node.nodeType.toLowerCase();
}

/** `/blogs/exams/nimcet/subject/mathematics/chapter/algebra` — each step is `<level>/<slug>`. */
export function blogsPath(examSlug: string, trail: Pick<SyllabusNode, 'nodeType' | 'slug'>[] = []) {
  return `/blogs/exams/${examSlug}${trail.map((n) => `/${nodeSegment(n)}/${n.slug}`).join('')}`;
}

/** Heading for a column of sibling nodes, from their level ("Chapters"), or "Sections" if mixed. */
export function childrenLabel(nodes: SyllabusNode[]) {
  const types = new Set(nodes.map((n) => n.nodeType));
  return types.size === 1 ? (NODE_TYPE_LABELS[[...types][0]] ?? 'Sections') : 'Sections';
}

/**
 * Resolves `/blogs/exams/[exam]/<level>/<slug>/...` against the exam's own syllabus tree:
 * each `<level>` must match the node's real type and each slug must be a child of the
 * previous node, so a URL can never point outside the exam it names. Null means 404.
 */
export async function resolveBlogBrowse(examSlug: string, path: string[]) {
  const exam = await taxonomyRepository.findExamBySlug(examSlug);
  if (!exam || exam.status !== 'ACTIVE') return null;
  if (path.length % 2 !== 0) return null;

  let level: SyllabusNode[] = await taxonomyRepository.getSyllabusTree(exam.id);
  const trail: SyllabusNode[] = [];
  for (let i = 0; i < path.length; i += 2) {
    const [segment, slug] = [path[i], path[i + 1]];
    const node = level.find((n) => n.slug === slug && nodeSegment(n) === segment);
    if (!node) return null;
    trail.push(node);
    level = node.children;
  }

  return { exam, trail, current: trail[trail.length - 1] ?? null, children: level };
}
