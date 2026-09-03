import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/server/api/helpers';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'exam'; // 'exam' | 'subject' | 'chapter'

    const progress = await assessmentRepository.getUserProgress(session.user.id, type as 'exam' | 'subject' | 'chapter');

    return apiSuccess(progress);
  } catch (err) {
    console.error('Progress fetch error:', err);
    return apiError('Failed to fetch progress', 500);
  }
}
