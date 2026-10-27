import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const UpdateExamSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  programId: z.uuid().optional(),
  thumbnailUrl: z.url().max(2048).optional(),
  // Full desired set of mapped curriculum nodes — the exam<->node relationship is a
  // genuine many-to-many (exam_node_map), unlike programId above, so this reconciles
  // membership (attach what's missing, detach what's no longer wanted) rather than replace.
  nodeIds: z.array(z.uuid()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const parsed = UpdateExamSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { nodeIds, ...fields } = parsed.data;
  if (Object.keys(fields).length > 0) {
    const updated = await taxonomyRepository.updateExam(id, fields);
    if (!updated) return apiError('Not found', 404);
  }
  if (nodeIds) {
    await taxonomyRepository.setExamNodes(id, nodeIds);
  }

  const exam = await taxonomyRepository.findExamById(id);
  if (!exam) return apiError('Not found', 404);

  return apiSuccess(exam);
}
