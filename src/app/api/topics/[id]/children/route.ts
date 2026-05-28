import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { topicRepository } from '@/server/repositories/topic.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const topic = await topicRepository.findById(id);
  if (!topic) return apiError('Topic not found', 404);

  const children = await topicRepository.getChildTopics(id);
  return apiSuccess(children);
}
