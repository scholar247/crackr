import { apiError, apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import type { TopicClient, TopicTreeNode } from '@/types';

async function buildExamTopicTree(examId: string, subjectId: string): Promise<TopicTreeNode[]> {
  const sections = await examRepository.getSections({ examId, subjectId, isActive: true });
  if (sections.length === 0) return [];
  const syllabusTopicIds = sections.map((s) => s.topicId);
  const allRelevantIds = new Set<string>(syllabusTopicIds);
  for (const topicId of syllabusTopicIds) {
    const descendants = await topicRepository.getDescendants(topicId);
    for (const d of descendants) allRelevantIds.add(d.id);
  }
  const topicsRaw = await topicRepository.getTopicsByIds([...allRelevantIds]);
  const ancestorIds = new Set<string>();
  for (const t of topicsRaw) for (const id of t.path) ancestorIds.add(id);
  const missingIds = [...ancestorIds].filter((id) => !allRelevantIds.has(id));
  const ancestorTopics = await topicRepository.getTopicsByIds(missingIds);
  const allTopics: TopicClient[] = [...topicsRaw, ...ancestorTopics];
  const map = new Map<string, TopicTreeNode>();
  const roots: TopicTreeNode[] = [];
  for (const t of allTopics) map.set(t.id, { ...t, children: [], inSyllabus: false });
  for (const t of allTopics) {
    if (t.parentId && map.has(t.parentId)) map.get(t.parentId)!.children.push(map.get(t.id)!);
    else if (!t.parentId) roots.push(map.get(t.id)!);
  }
  roots.sort((a, b) => a.order - b.order);
  const syllabusSet = new Set(syllabusTopicIds);
  function mark(nodes: TopicTreeNode[]) {
    for (const n of nodes) { n.inSyllabus = syllabusSet.has(n.id); mark(n.children); }
  }
  mark(roots);
  return roots;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;

  try {
    const exam = await examRepository.findBySlug(slug);
    if (!exam) return apiError('Exam not found', 404);

    const linkedSubjects = exam.subjectIds.length > 0
      ? await subjectRepository.getSubjectsByIds(exam.subjectIds)
      : [];
    const examSubjects = linkedSubjects
      .filter((s) => s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ id: s.id, name: s.name }));

    const firstSubjectId = examSubjects[0]?.id ?? null;
    const initialTopicTree = firstSubjectId
      ? await buildExamTopicTree(exam.id, firstSubjectId)
      : [];

    return apiSuccess({ exam, examSubjects, initialTopicTree });
  } catch (err) {
    console.error('[GET /api/public/exams/[id]]', err);
    return apiError('Failed to fetch exam', 500);
  }
}
