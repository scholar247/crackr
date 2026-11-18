import { requireAuth } from '@/server/auth/require-auth';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { apiError, apiSuccess } from '@/lib/utils';

type Ctx = { params: Promise<{ id: string; versionId: string }> };

// GET — one published version's snapshot (for preview / "restore into draft" in the editor).
export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id, versionId } = await params;
  const version = await mindMapRepository.findVersion(id, versionId);
  if (!version) return apiError('Not found', 404);
  return apiSuccess(version);
}
