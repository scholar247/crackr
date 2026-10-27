import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiSuccess } from '@/lib/utils';

// Powers the admin syllabus graph's lineage view (every parent + exam of a node).
export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  return apiSuccess(await taxonomyRepository.getCurriculumGraph());
}
