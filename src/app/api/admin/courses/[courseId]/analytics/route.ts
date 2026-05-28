import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { liveSessionRepository } from '@/server/repositories/liveSession.repository';
import type { CourseAnalytics } from '@/types/course.types';

export const revalidate = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);

  const [enrollments, lessons, subjects, sessions] = await Promise.all([
    enrollmentRepository.findByCourse(courseId),
    courseLessonRepository.findByCourse(courseId),
    courseSubjectRepository.findByCourse(courseId),
    liveSessionRepository.findByCourse(courseId),
  ]);

  const totalEnrolled = enrollments.length;
  const activeStudents = enrollments.filter((e) => {
    if (!e.lastAccessedAt) return false;
    return new Date(e.lastAccessedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  const avgProgress = totalEnrolled > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrolled)
    : 0;

  const completed = enrollments.filter((e) => e.status === 'COMPLETED').length;
  const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const liveAttendanceRate = completedSessions.length > 0 && totalEnrolled > 0
    ? Math.round((completedSessions.reduce((sum, s) => sum + s.attendanceCount, 0) / completedSessions.length / totalEnrolled) * 100)
    : 0;

  // Enrollment trend (last 30 days)
  const enrollmentTrend = buildEnrollmentTrend(enrollments.map((e) => e.enrolledAt));

  // Progress distribution
  const progressDistribution = [
    { bucket: '0-25%', count: enrollments.filter((e) => e.progress <= 25).length },
    { bucket: '26-50%', count: enrollments.filter((e) => e.progress > 25 && e.progress <= 50).length },
    { bucket: '51-75%', count: enrollments.filter((e) => e.progress > 50 && e.progress <= 75).length },
    { bucket: '76-99%', count: enrollments.filter((e) => e.progress > 75 && e.progress < 100).length },
    { bucket: 'Completed', count: completed },
  ];

  // Subject completion rates
  const subjectCompletion = subjects.map((subject) => {
    const subjectLessonIds = new Set(lessons.filter((l) => l.courseTopicId).map((l) => l.id));
    const completedEnrollments = enrollments.filter((e) => {
      const completed = e.completedLessonIds.filter((id) => subjectLessonIds.has(id));
      return completed.length === subjectLessonIds.size && subjectLessonIds.size > 0;
    });
    const completionRate = totalEnrolled > 0 && subjectLessonIds.size > 0
      ? Math.round((completedEnrollments.length / totalEnrolled) * 100)
      : 0;
    return { subjectTitle: subject.title, completionRate };
  });

  // Session attendance
  const sessionAttendance = completedSessions.map((s) => ({
    title: s.title,
    date: s.scheduledAt,
    attended: s.attendanceCount,
    percentOfEnrolled: totalEnrolled > 0 ? Math.round((s.attendanceCount / totalEnrolled) * 100) : 0,
  }));

  // Lesson engagement (simplified — real impl would track per-lesson views)
  const lessonEngagement = lessons.map((l) => ({
    title: l.title,
    type: l.type,
    views: enrollments.filter((e) => e.completedLessonIds.includes(l.id)).length,
    avgCompletionPct: totalEnrolled > 0
      ? Math.round((enrollments.filter((e) => e.completedLessonIds.includes(l.id)).length / totalEnrolled) * 100)
      : 0,
  }));

  const analytics: CourseAnalytics = {
    totalEnrolled,
    activeStudents,
    avgProgress,
    completionRate,
    liveAttendanceRate,
    enrollmentTrend,
    progressDistribution,
    subjectCompletion,
    sessionAttendance,
    lessonEngagement,
  };

  return apiSuccess(analytics);
}

function buildEnrollmentTrend(dates: string[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const d of dates) {
    const key = new Date(d).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([date, count]) => ({ date, count }));
}
