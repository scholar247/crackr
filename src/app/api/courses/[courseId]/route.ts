import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';

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

  const [enrollment, subjects, liveSessions] = await Promise.all([
    enrollmentRepository.findOne(courseId, session!.user.id),
    courseSubjectRepository.findByCourse(courseId),
    liveSessionRepository.findLiveNow(),
  ]);

  const isLive = liveSessions.some((s) => s.courseId === courseId);

  return apiSuccess({ course, enrollment, subjects, isLive });
}
