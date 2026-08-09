import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const SetExamNodesSchema = z.object({ nodeIds: z.array(z.uuid()) });

// Curriculum node ids currently mapped to this exam (exam_node_map) — used to prefill the
// checkbox list in the exam edit dialog.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  return apiSuccess(await taxonomyRepository.listNodeIdsForExam(id));
}

// Reconciles exam_node_map to exactly `nodeIds` (attach what's missing, detach what's no
// longer wanted) — the write side of the checkbox list above, and how a seed script wires
// a batch of curriculum nodes to an exam in one call instead of one attach per node.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = SetExamNodesSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { id } = await params;
  await taxonomyRepository.setExamNodes(id, parsed.data.nodeIds);
  return apiSuccess(await taxonomyRepository.listNodeIdsForExam(id));
}
