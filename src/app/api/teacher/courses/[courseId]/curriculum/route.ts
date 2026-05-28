import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);

  // Teachers can only access their own courses
  if (
    session!.user.role === 'TEACHER' &&
    !course.teacherIds.includes(session!.user.id)
  ) {
    return apiError('Forbidden', 403);
  }

  const subjects = await courseSubjectRepository.findByCourse(courseId);
  const curriculum = await Promise.all(
    subjects.map(async (subject) => {
      const topics = await courseTopicRepository.findBySubject(subject.id);
      const topicsWithLessons = await Promise.all(
        topics.map(async (topic) => {
          const lessons = await courseLessonRepository.findByTopic(topic.id);
          return { ...topic, lessons };
        })
      );
      return { ...subject, topics: topicsWithLessons };
    })
  );

  return apiSuccess({ course, curriculum });
}
