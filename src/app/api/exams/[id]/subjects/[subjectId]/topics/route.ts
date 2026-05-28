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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id: examId, subjectId } = await params;

  const sections = await examRepository.getSections({ examId, subjectId, isActive: true });
  if (sections.length === 0) {
    return apiSuccess([], { examId, subjectId, syllabusTopicCount: 0, totalTopicCount: 0 });
  }

  const syllabusTopicIds = sections.map((s) => s.topicId);

  // Collect all relevant topic IDs: syllabus topics + descendants
  const allRelevantTopicIds = new Set<string>(syllabusTopicIds);
  for (const topicId of syllabusTopicIds) {
    const descendants = await topicRepository.getDescendants(topicId);
    for (const d of descendants) allRelevantTopicIds.add(d.id);
  }

  const topicsRaw = await topicRepository.getTopicsByIds([...allRelevantTopicIds]);

  // Collect ancestor IDs for tree structure
  const ancestorIds = new Set<string>();
  for (const t of topicsRaw) {
    for (const id of t.path) ancestorIds.add(id);
  }
  const missingAncestorIds = [...ancestorIds].filter((id) => !allRelevantTopicIds.has(id));
  const ancestorTopics = await topicRepository.getTopicsByIds(missingAncestorIds);

  const allTopics = [...topicsRaw, ...ancestorTopics];
  const tree = buildTopicTree(allTopics);
  markSyllabusNodes(tree, new Set(syllabusTopicIds));

  return apiSuccess(tree, {
    examId,
    subjectId,
    syllabusTopicCount: syllabusTopicIds.length,
    totalTopicCount: allTopics.length,
  });
}
