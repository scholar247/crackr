import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const subjectId = searchParams.get('subjectId') ?? undefined;
  const active = searchParams.get('active') === 'true';

  if (subjectId) {
    const exams = await examRepository.findBySubject(subjectId);
    return apiSuccess(exams);
  }
  if (category) {
    const exams = await examRepository.findByCategory(category);
    return apiSuccess(exams);
  }
  const exams = await examRepository.findAll(active || undefined);
  return apiSuccess(exams);
}
