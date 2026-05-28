import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { tagRepository } from '@/server/repositories/tag.repository';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const tags = await tagRepository.findAll();
  return apiSuccess(tags);
}
