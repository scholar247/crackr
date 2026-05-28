import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';

export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const level = searchParams.get('level') ?? undefined;
  const language = searchParams.get('language') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const courses = await courseRepository.findPublished({ examId, type, level, language, search });

  const liveSessions = await liveSessionRepository.findLiveNow();
  const liveCoursIds = new Set(liveSessions.map((s) => s.courseId));

  const enrollments = await enrollmentRepository.findByUser(session!.user.id);
  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));

  const enriched = courses.map((course) => ({
    ...course,
    enrollment: enrollmentMap.get(course.id),
    isLive: liveCoursIds.has(course.id),
  }));

  return apiSuccess(enriched);
}
