import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { UpdateCourseTopicSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { topicId } = await params;
  const body = await req.json();
  const parsed = UpdateCourseTopicSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await courseTopicRepository.update(topicId, parsed.data);
  if (!topic) return apiError('Topic not found', 404);
  return apiSuccess(topic);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { subjectId, topicId } = await params;
  const ok = await courseTopicRepository.delete(topicId);
  if (!ok) return apiError('Topic not found', 404);
  await courseSubjectRepository.incrementTopicCount(subjectId, -1);
  return apiSuccess({ ok: true });
}
