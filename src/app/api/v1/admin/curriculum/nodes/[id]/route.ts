import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const UpdateNodeSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(1000).optional(),
  thumbnailUrl: z.url().max(2048).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  // Full desired set of parents — a node can have more than one (e.g. Thermodynamics
  // under both Physics and Chemistry). Reconciled (attach/detach), not replaced wholesale
  // the way a single value would be. Omit entirely to leave parent edges untouched.
  parentNodeIds: z.array(z.uuid()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const parsed = UpdateNodeSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { parentNodeIds, ...fields } = parsed.data;
  if (Object.keys(fields).length > 0) {
    const updated = await taxonomyRepository.updateNode(id, fields);
    if (!updated) return apiError('Not found', 404);
  }
  if (parentNodeIds) {
    try {
      await taxonomyRepository.setNodeParents(id, parentNodeIds);
    } catch (err) {
      return apiError(err instanceof Error ? err.message : 'Failed to update parents', 400);
    }
  }

  const node = await taxonomyRepository.findNodeById(id);
  if (!node) return apiError('Not found', 404);

  return apiSuccess(node);
}
