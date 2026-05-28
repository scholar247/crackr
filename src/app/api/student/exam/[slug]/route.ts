import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const dbExam = await examRepository.findBySlug(slug).catch(() => null);
  const allCourses = dbExam
    ? await courseRepository.findPublished({ examId: dbExam.id }).catch(() => [])
    : [];

  let enrollmentMap: Record<string, number> = {};
  try {
    const enrollments = await enrollmentRepository.findByUser(session!.user.id);
    for (const e of enrollments) enrollmentMap[e.courseId] = e.progress;
  } catch { /* ok */ }

  return apiSuccess({ dbExam, allCourses, enrollmentMap });
}
