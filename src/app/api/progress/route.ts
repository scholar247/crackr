import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { progressService } from '@/server/services/progress.service';
import { ProgressQuerySchema } from '@/schemas';

export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parsed = ProgressQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query params' }, { status: 400 });
  }

  const data = await progressService.getProgress(session!.user.id, parsed.data);
  return apiSuccess(data);
}
