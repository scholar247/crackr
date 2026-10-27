import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET() {
  const programs = await taxonomyRepository.listPublicPrograms();
  return apiSuccess(programs);
}
