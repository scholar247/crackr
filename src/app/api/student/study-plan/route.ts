import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { userRepository } from '@/server/repositories/user.repository';

const NIMCET_SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#6366f1',
  'Computer Applications': '#0ea5e9',
  'Analytical Ability & Logical Reasoning': '#f59e0b',
  'General English': '#10b981',
  'General Awareness': '#ec4899',
};

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await userRepository.findById(session!.user.id);
  const dailyGoal = user?.profile?.dailyGoalQuestions ?? 20;
  const primaryExamId = user?.profile?.primaryExamId ?? '';

  let nimcetExam: Awaited<ReturnType<typeof examRepository.findBySlug>> = null;
  let nimcetSubjects: Array<{ subjectId: string; subjectName: string; subjectColor: string; attempted: number; total: number }> = [];

  try {
    nimcetExam = await examRepository.findBySlug('nimcet') ??
      (primaryExamId ? await examRepository.findById(primaryExamId) : null);

    if (nimcetExam) {
      const sections = await examRepository.getSectionsByExam(nimcetExam.id);
      const subjectIds = [...new Set(sections.map((s) => s.subjectId))];
      const subjects = subjectIds.length > 0 ? await subjectRepository.getSubjectsByIds(subjectIds) : [];
      nimcetSubjects = subjects.map((sub) => ({
        subjectId: sub.id,
        subjectName: sub.name,
        subjectColor: NIMCET_SUBJECT_COLORS[sub.name] ?? sub.color ?? '#6366f1',
        attempted: 0,
        total: sections.filter((s) => s.subjectId === sub.id).length,
      }));
    }
  } catch { /* ok */ }

  let enrolledCourses: Array<{ id: string; title: string; progress: number; lastLessonId?: string }> = [];
  try {
    const enrollments = await enrollmentRepository.findByUser(session!.user.id);
    if (enrollments.length > 0) {
      const courseIds = enrollments.map((e) => e.courseId);
      const courses = await Promise.all(courseIds.map((id) => courseRepository.findById(id)));
      let mapped = enrollments
        .map((e) => {
          const c = courses.find((c) => c?.id === e.courseId);
          if (!c) return null;
          if (nimcetExam && c.examId !== nimcetExam.id) return null;
          return { id: c.id, title: c.title, progress: e.progress, lastLessonId: e.lastLessonId };
        })
        .filter(Boolean) as typeof enrolledCourses;

      if (mapped.length === 0 && nimcetExam) {
        mapped = enrollments
          .map((e) => {
            const c = courses.find((c) => c?.id === e.courseId);
            if (!c) return null;
            return { id: c.id, title: c.title, progress: e.progress, lastLessonId: e.lastLessonId };
          })
          .filter(Boolean) as typeof enrolledCourses;
      }
      enrolledCourses = mapped;
    }
  } catch { /* ok */ }

  return apiSuccess({ dailyGoal, nimcetExam, nimcetSubjects, enrolledCourses, userName: user?.name ?? 'Student' });
}
