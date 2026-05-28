import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { CreateCourseTopicSchema } from '@/schemas/course.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { subjectId } = await params;
  const topics = await courseTopicRepository.findBySubject(subjectId);
  return apiSuccess(topics);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId, subjectId } = await params;
  const body = await req.json();
  const parsed = CreateCourseTopicSchema.safeParse({ ...body, courseSubjectId: subjectId, courseId });
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await courseTopicRepository.create(parsed.data);
  await courseSubjectRepository.incrementTopicCount(subjectId, 1);
  return apiSuccess(topic, undefined, 201);
}
