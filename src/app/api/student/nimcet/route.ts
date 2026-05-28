import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import type { SubjectClient } from '@/types';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const nimcetExam = await examRepository.findBySlug('nimcet');
  const allCourses = nimcetExam
    ? await courseRepository.findPublished({ examId: nimcetExam.id })
    : [];

  let enrollmentMap: Record<string, number> = {};
  try {
    const enrollments = await enrollmentRepository.findByUser(session!.user.id);
    for (const e of enrollments) enrollmentMap[e.courseId] = e.progress;
  } catch { /* ok */ }

  let subjectsMap: Record<string, SubjectClient> = {};
  let coverageMap: Record<string, { attempted: number; total: number; accuracy: number | null }> = {};

  if (nimcetExam) {
    try {
      const sections = await examRepository.getSectionsByExam(nimcetExam.id);
      const subjectIds = [...new Set(sections.map((s) => s.subjectId))];
      if (subjectIds.length > 0) {
        const subjects = await subjectRepository.getSubjectsByIds(subjectIds);
        for (const s of subjects) subjectsMap[s.id] = s;
        for (const subId of subjectIds) {
          const subSections = sections.filter((s) => s.subjectId === subId);
          coverageMap[subId] = { attempted: 0, total: subSections.length, accuracy: null };
        }
      }
    } catch { /* ok */ }
  }

  return apiSuccess({ nimcetExam, allCourses, enrollmentMap, subjectsMap, coverageMap });
}
