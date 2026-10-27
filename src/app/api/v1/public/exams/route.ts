import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET() {
  const rows = await taxonomyRepository.listPublicExams();
  return apiSuccess(rows.map(({ exam, programName }) => ({ ...exam, programName })));
}
