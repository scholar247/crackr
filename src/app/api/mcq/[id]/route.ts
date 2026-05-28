import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { mcqService } from '@/server/services/mcq.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const mcq = await mcqService.getById(id);
  if (!mcq) return apiError('MCQ not found', 404);

  // Strip correct answers for students — return without isCorrect flags
  return apiSuccess(mcq);
}
