import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { CreateCourseLessonSchema } from '@/schemas/course.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { topicId } = await params;
  const lessons = await courseLessonRepository.findByTopic(topicId);
  return apiSuccess(lessons);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId, subjectId, topicId } = await params;
  const body = await req.json();
  const parsed = CreateCourseLessonSchema.safeParse({ ...body, courseTopicId: topicId, courseId });
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await courseLessonRepository.create(parsed.data);
  await courseTopicRepository.incrementLessonCount(topicId, 1);
  await courseSubjectRepository.incrementLessonCount(subjectId, 1);

  const totalLessons = await courseLessonRepository.countByCourse(courseId);
  await courseRepository.updateStats(courseId, { totalLessons });

  return apiSuccess(lesson, undefined, 201);
}
