import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { courseRepository } from '@/server/repositories/course.repository';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId, lessonId } = await params;

  const [lesson, course, enrollment] = await Promise.all([
    courseLessonRepository.findById(lessonId),
    courseRepository.findById(courseId),
    enrollmentRepository.findOne(courseId, session!.user.id),
  ]);

  if (!lesson) return apiError('Lesson not found', 404);
  if (!course) return apiError('Course not found', 404);
  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return apiError('Not enrolled in this course', 403);
  }

  const updated = await enrollmentRepository.markLessonComplete(
    courseId,
    session!.user.id,
    lessonId,
    course.totalLessons
  );

  return apiSuccess(updated);
}
