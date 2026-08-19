import { requireAuth } from '@/server/auth/require-auth';
import { mediaService } from '@/server/media/media.service';
import { toMediaResponse } from '@/server/media/media-response';
import { apiSuccess } from '@/lib/utils';

// "My Media" — authenticated, always scoped to the caller (never accepts a userId param),
// newest first. Same pagination response shape as /api/v1/admin/questions and
// /api/v1/admin/blog: apiSuccess(rows, { total, page, limit, totalPages }).
export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  // Accepts either `pageSize` or `limit` — the former matches this endpoint's spec, the
  // latter matches every other paginated list route in this codebase.
  const limitParam = Number(searchParams.get('pageSize') ?? searchParams.get('limit'));
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

  const { rows, total } = await mediaService.listMine(session!.user.id, page, limit);
  return apiSuccess(rows.map(toMediaResponse), { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
}
