import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import { getMongoDb } from '@/lib/mongodb';
import type { CourseSubjectWithTopics, CourseLessonWithAccess, CourseAnnouncementClient } from '@/types/course.types';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lesson') ?? undefined;

  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);

  const enrollment = await enrollmentRepository.findOne(courseId, session!.user.id);
  if (!enrollment || enrollment.status === 'CANCELLED') return apiError('Not enrolled', 403);

  const completedIds = new Set(enrollment.completedLessonIds ?? []);
  const subjects = await courseSubjectRepository.findByCourse(courseId);

  const curriculum: CourseSubjectWithTopics[] = await Promise.all(
    subjects.map(async (subject) => {
      const topics = await courseTopicRepository.findBySubject(subject.id);
      const topicsWithLessons = await Promise.all(
        topics.map(async (topic) => {
          const lessons = await courseLessonRepository.findByTopic(topic.id);
          const lessonsWithAccess: CourseLessonWithAccess[] = lessons.map((lesson) => ({
            ...lesson,
            isLocked: false,
            completionStatus: completedIds.has(lesson.id)
              ? 'completed'
              : lesson.id === enrollment.lastLessonId
              ? 'current'
              : 'available',
          }));
          return { ...topic, lessons: lessonsWithAccess };
        })
      );
      return { ...subject, topics: topicsWithLessons };
    })
  );

  const allLessons = curriculum.flatMap((s) => s.topics.flatMap((t) => t.lessons));
  const activeLessonId = lessonId ?? enrollment.lastLessonId ?? allLessons[0]?.id;
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? null;
  const activeLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null;
  const nextLesson = activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1] : null;

  const [upcomingSessions, announcements] = await Promise.all([
    liveSessionRepository.findUpcomingByCourse(courseId),
    getMongoDb().then((db) =>
      db.collection('courseAnnouncements')
        .find({ courseId })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()
        .then((docs) => docs.map(({ _id, ...d }) => d as unknown as CourseAnnouncementClient))
    ),
  ]);

  return apiSuccess({
    courseId,
    courseTitle: course.title,
    curriculum,
    activeLesson,
    activeLessonId,
    prevLesson,
    nextLesson,
    progress: enrollment.progress,
    upcomingSessions,
    announcements,
  });
}
