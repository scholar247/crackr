import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const MapSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
  // null clears the selected articles' mapping.
  nodeId: z.uuid().nullable(),
});

// Admin-only: bulk curriculum mapping is a library-wide editorial action, like bulk-status.
export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  return apiSuccess(await articleRepository.listForNodeMapping());
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = MapSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { ids, nodeId } = parsed.data;
  if (nodeId) {
    const node = await taxonomyRepository.findNodeById(nodeId);
    if (!node || node.status !== 'ACTIVE') return apiError('Node not found or archived', 404);
  }

  const updated = await articleRepository.mapManyToNode(ids, nodeId);
  return apiSuccess({ updated });
}
