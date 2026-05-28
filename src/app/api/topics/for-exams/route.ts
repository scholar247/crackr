import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import type { TopicClient, TopicTreeNode } from '@/types';

function buildTopicTree(topics: TopicClient[]): TopicTreeNode[] {
  const map = new Map<string, TopicTreeNode>();
  const roots: TopicTreeNode[] = [];

  for (const t of topics) {
    map.set(t.id, { ...t, children: [], inSyllabus: false });
  }
  for (const t of topics) {
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!.children.push(map.get(t.id)!);
    } else if (!t.parentId) {
      roots.push(map.get(t.id)!);
    }
  }

  roots.sort((a, b) => a.order - b.order);
  return roots;
}

function markSyllabusNodes(nodes: TopicTreeNode[], inSyllabusIds: Set<string>): void {
  for (const node of nodes) {
    node.inSyllabus = inSyllabusIds.has(node.id);
    if (node.children.length > 0) markSyllabusNodes(node.children, inSyllabusIds);
  }
}

export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const examIdsParam = searchParams.get('examIds');
  const subjectId = searchParams.get('subjectId');

  if (!examIdsParam || !subjectId) {
    return Response.json({ error: 'examIds and subjectId required' }, { status: 400 });
  }

  const examIds = examIdsParam.split(',').filter(Boolean);
  if (examIds.length === 0) {
    return Response.json({ error: 'examIds must not be empty' }, { status: 400 });
  }

  // Get sections for all exams + subject
  const sections = await examRepository.getSectionsByExamIds(examIds);
  const subjectSections = sections.filter((s) => s.subjectId === subjectId);
  const syllabusTopicIds = new Set(subjectSections.map((s) => s.topicId));

  if (syllabusTopicIds.size === 0) {
    return apiSuccess([], { examIds, subjectId });
  }

  // Collect all relevant topic IDs: syllabus + descendants
  const allTopicIds = new Set<string>(syllabusTopicIds);
  for (const topicId of syllabusTopicIds) {
    const descendants = await topicRepository.getDescendants(topicId);
    for (const d of descendants) allTopicIds.add(d.id);
  }

  const topics = await topicRepository.getTopicsByIds([...allTopicIds]);

  // Ancestors for tree structure
  const ancestorIds = new Set<string>();
  for (const t of topics) {
    for (const id of t.path) ancestorIds.add(id);
  }
  const missingAncestorIds = [...ancestorIds].filter((id) => !allTopicIds.has(id));
  const ancestors = await topicRepository.getTopicsByIds(missingAncestorIds);

  const tree = buildTopicTree([...topics, ...ancestors]);
  markSyllabusNodes(tree, syllabusTopicIds);

  return apiSuccess(tree, { examIds, subjectId });
}
