import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { topicRepository } from '@/server/repositories/topic.repository';
import { CreateTopicSchema } from '@/schemas';

export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId');
  const parentId = searchParams.get('parentId');
  const tree = searchParams.get('tree') === 'true';

  if (!subjectId) {
    return Response.json({ error: 'subjectId is required' }, { status: 400 });
  }

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

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateTopicSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const topic = await topicRepository.create(parsed.data);
    return apiSuccess(topic, undefined, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create topic';
    return Response.json({ error: message }, { status: 422 });
  }
}
