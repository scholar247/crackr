import { apiSuccess, apiError } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const subjectId = searchParams.get('subjectId') ?? undefined;
  // Default to active-only; pass ?active=false to include inactive
  const activeOnly = searchParams.get('active') !== 'false';

  try {
    if (subjectId) {
      const exams = await examRepository.findBySubject(subjectId);
      return apiSuccess(exams);
    }
    if (category) {
      const exams = await examRepository.findByCategory(category, activeOnly);
      return apiSuccess(exams);
    }
    const exams = await examRepository.findAll(activeOnly);
    return apiSuccess(exams);
  } catch (err) {
    console.error('[GET /api/public/exams]', err);
    return apiError('Failed to fetch exams', 500);
  }
}
