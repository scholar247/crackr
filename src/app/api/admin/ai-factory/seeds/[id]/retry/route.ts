import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { contentSeedRepository } from '@/server/repositories/ai-seed.repository';

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('EDITOR');
  if (error) return error;

  const { id } = await params;
  const seed = await contentSeedRepository.retry(id);
  if (!seed) return apiError('Seed not found or not in FAILED status', 404);

  return apiSuccess(seed);
}
