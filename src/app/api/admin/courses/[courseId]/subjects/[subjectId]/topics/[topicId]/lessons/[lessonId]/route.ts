import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { UpdateCourseLessonSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string; lessonId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { lessonId } = await params;
  const body = await req.json();
  const parsed = UpdateCourseLessonSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await courseLessonRepository.update(lessonId, parsed.data);
  if (!lesson) return apiError('Lesson not found', 404);
  return apiSuccess(lesson);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string; lessonId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId, subjectId, topicId, lessonId } = await params;
  const ok = await courseLessonRepository.delete(lessonId);
  if (!ok) return apiError('Lesson not found', 404);

  await courseTopicRepository.incrementLessonCount(topicId, -1);
  await courseSubjectRepository.incrementLessonCount(subjectId, -1);

  const totalLessons = await courseLessonRepository.countByCourse(courseId);
  await courseRepository.updateStats(courseId, { totalLessons });

  return apiSuccess({ ok: true });
}
