import { apiError, apiSuccess } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { topicRepository } from '@/server/repositories/topic.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;
  const subject = await subjectRepository.findBySlug(slug);
  if (!subject) return apiError('Subject not found', 404);
  const topicTree = await topicRepository.getTopicTree(subject.id);
  return apiSuccess({ subject, topicTree });
}
