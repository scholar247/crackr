import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { articleRepository } from '@/server/repositories/article.repository';
import { taxonomyRepository, NodePathError } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const MapSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
  // The one root → leaf chain to attach to (a node can sit under several parents, so the
  // chain — not just the leaf — is the selection). null clears the selected articles' mapping.
  nodePath: z.array(z.uuid()).min(1).max(12).nullable(),
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

  const { ids, nodePath } = parsed.data;
  try {
    if (nodePath) await taxonomyRepository.validateNodePath(nodePath);
    const updated = await articleRepository.mapManyToNode(ids, nodePath);
    return apiSuccess({ updated });
  } catch (e) {
    if (e instanceof NodePathError) return apiError(e.message, 400);
    throw e;
  }
}
