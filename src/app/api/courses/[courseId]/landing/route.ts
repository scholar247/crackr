import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (course.status !== 'PUBLISHED' && course.status !== 'COMING_SOON' && session!.user.role === 'STUDENT') {
    return apiError('Course not found', 404);
  }

  const [subjects, enrollment, upcomingSessions, exam, teachers] = await Promise.all([
    courseSubjectRepository.findByCourse(courseId),
    enrollmentRepository.findOne(courseId, session!.user.id),
    liveSessionRepository.findUpcomingByCourse(courseId),
    examRepository.findById(course.examId),
    course.teacherIds.length > 0 ? userRepository.findByIds(course.teacherIds) : Promise.resolve([]),
  ]);

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

  return apiSuccess({ course, curriculum, enrollment, upcomingSessions, exam, teachers });
}
