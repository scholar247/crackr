import { taxonomyRepository, type NodeType } from '@/server/repositories/taxonomy.repository';
import { apiSuccess } from '@/lib/utils';

const NODE_TYPES: readonly NodeType[] = ['SUBJECT', 'CHAPTER', 'TOPIC', 'SUBTOPIC'];

// No auth — same convention as /api/v1/public/exams. Flat, filterable list of curriculum
// nodes (subjects/chapters/topics/subtopics): ?nodeType=SUBJECT and/or ?examId=<uuid> to
// scope to one exam's syllabus. With neither filter, returns every active node globally.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nodeTypeParam = searchParams.get('nodeType');
  const nodeType = NODE_TYPES.includes(nodeTypeParam as NodeType) ? (nodeTypeParam as NodeType) : undefined;
  const examId = searchParams.get('examId') ?? undefined;

  const nodes = await taxonomyRepository.listPublicNodes({ nodeType, examId });
  return apiSuccess(nodes);
}
