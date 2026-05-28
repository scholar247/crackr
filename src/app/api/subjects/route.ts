import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const subjects = await subjectRepository.findAll(true);
    return apiSuccess(subjects);
  } catch (e) {
    console.error('[GET /api/subjects]', e);
    return apiError('Failed to fetch subjects', 500);
  }
}
