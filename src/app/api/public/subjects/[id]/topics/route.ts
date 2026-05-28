import { apiSuccess } from '@/lib/utils';
import { topicRepository } from '@/server/repositories/topic.repository';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: subjectId } = await params;
  const { searchParams } = new URL(req.url);
  const tree = searchParams.get('tree') === 'true';
  const parentId = searchParams.get('parentId');

  if (tree) {
    const topics = await topicRepository.getTopicTree(subjectId);
    return apiSuccess(topics);
  }
  if (parentId) {
    const topics = await topicRepository.getChildTopics(parentId);
    return apiSuccess(topics);
  }
  const topics = await topicRepository.getRootTopics(subjectId);
  return apiSuccess(topics);
}
