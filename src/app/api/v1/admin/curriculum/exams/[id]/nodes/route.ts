import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiSuccess } from '@/lib/utils';

// Curriculum node ids currently mapped to this exam (exam_node_map) — used to prefill the
// checkbox list in the exam edit dialog.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  return apiSuccess(await taxonomyRepository.listNodeIdsForExam(id));
}
