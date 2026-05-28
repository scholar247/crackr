import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId') ?? undefined;
  const examSlug = searchParams.get('examSlug') ?? undefined;

  try {
    if (examSlug && !examId) {
      const exam = await examRepository.findBySlug(examSlug);
      if (!exam) return apiError('Exam not found', 404);
      const pyps = await pypRepository.findByExam(exam.id, true);
      return apiSuccess(pyps);
    }

    if (examId) {
      const pyps = await pypRepository.findByExam(examId, true);
      return apiSuccess(pyps);
    }

    const pyps = await pypRepository.findAll(true);
    return apiSuccess(pyps);
  } catch (err) {
    console.error('[public/pyp]', err);
    return apiError('Internal server error', 500);
  }
}
