import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const attempt = await testService.startAttempt(id, session!.user.id);
    return apiSuccess(attempt, undefined, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start test';
    return Response.json({ error: message }, { status: 422 });
  }
}
