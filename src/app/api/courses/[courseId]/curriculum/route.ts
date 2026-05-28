import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import type { CourseSubjectWithTopics, CourseLessonWithAccess } from '@/types/course.types';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (course.status !== 'PUBLISHED' && session!.user.role === 'STUDENT') {
    return apiError('Course not found', 404);
  }

  const enrollment = await enrollmentRepository.findOne(courseId, session!.user.id);
  const isEnrolled = enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED';
  const completedIds = new Set(enrollment?.completedLessonIds ?? []);

  const subjects = await courseSubjectRepository.findByCourse(courseId);

  const curriculum: CourseSubjectWithTopics[] = await Promise.all(
    subjects.map(async (subject) => {
      const topics = await courseTopicRepository.findBySubject(subject.id);
      const topicsWithLessons = await Promise.all(
        topics.map(async (topic) => {
          const lessons = await courseLessonRepository.findByTopic(topic.id);
          const lessonsWithAccess: CourseLessonWithAccess[] = lessons.map((lesson) => {
            const isLocked = !isEnrolled && !lesson.isFree;
            let completionStatus: 'completed' | 'current' | 'locked' | 'available';
            if (isLocked) completionStatus = 'locked';
            else if (completedIds.has(lesson.id)) completionStatus = 'completed';
            else if (lesson.id === enrollment?.lastLessonId) completionStatus = 'current';
            else completionStatus = 'available';

            return {
              ...lesson,
              isLocked,
              completionStatus,
              // strip sensitive content if locked
              ...(isLocked ? { videoUrl: undefined, textContent: undefined, pdfUrl: undefined } : {}),
            };
          });
          return { ...topic, lessons: lessonsWithAccess };
        })
      );
      return { ...subject, topics: topicsWithLessons };
    })
  );

  return apiSuccess({ curriculum, enrollment });
}
