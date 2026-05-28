import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const dbUser = await userRepository.findById(session!.user.id);
  const targetExamIds = dbUser?.profile?.targetExamIds ?? [];
  let targetExams: { id: string; name: string; slug: string }[] = [];
  if (targetExamIds.length > 0) {
    const exams = await examRepository.getExamsByIds(targetExamIds);
    targetExams = exams.filter((e) => e.slug).map((e) => ({ id: e.id, name: e.name, slug: e.slug }));
  }
  return apiSuccess({
    role: dbUser?.role,
    onboardingCompleted: dbUser?.profile?.onboardingCompleted ?? false,
    targetExams,
  });
}
