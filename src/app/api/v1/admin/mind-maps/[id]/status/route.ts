import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { changeMindMapStatus } from '@/server/services/mind-maps';
import { MindMapActionSchema } from '@/schemas/mind-map.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// POST /api/v1/admin/mind-maps/{id}/status { action } — submit / return / publish /
// unpublish / archive / restore. Publishing freezes the current draft as the live version.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = MindMapActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid action', 400);

  const result = await changeMindMapStatus((await params).id, parsed.data.action, isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id);
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess({ status: result.status });
}
