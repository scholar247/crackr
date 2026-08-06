import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const UpdateNodeSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  // Present + a uuid: set that parent. Present + null: clear (make it a root node).
  // Omitted entirely: leave the parent edge untouched.
  parentNodeId: z.uuid().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateNodeSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { parentNodeId, ...fields } = parsed.data;
  if (Object.keys(fields).length > 0) {
    const updated = await taxonomyRepository.updateNode(id, fields);
    if (!updated) return apiError('Not found', 404);
  }
  if ('parentNodeId' in body) {
    try {
      await taxonomyRepository.setNodeParent(id, parentNodeId ?? null);
    } catch (err) {
      return apiError(err instanceof Error ? err.message : 'Failed to update parent', 400);
    }
  }

  const node = await taxonomyRepository.findNodeById(id);
  if (!node) return apiError('Not found', 404);

  return apiSuccess(node);
}
