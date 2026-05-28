import { apiError, apiSuccess } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';

export async function GET() {
  try {
    const subjects = await subjectRepository.findAll(true);
    return apiSuccess(subjects);
  } catch (e) {
    console.error('[GET /api/public/subjects]', e);
    return apiError('Failed to fetch subjects', 500);
  }
}
