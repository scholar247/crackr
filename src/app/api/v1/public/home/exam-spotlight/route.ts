import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const programId = params.get('program');
  if (programId) return apiSuccess(await examSpotlightRepository.getProgramStats(programId));

  const slug = params.get('exam');
  if (!slug) return apiError('exam or program is required', 400);

  const examId = await examSpotlightRepository.findActiveExamIdBySlug(slug);
  if (!examId) return apiError('Not found', 404);

  return apiSuccess(await examSpotlightRepository.getSpotlight(examId));
}
