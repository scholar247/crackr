import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { mockService } from '@/server/services/mock.service';
import { SubmitAttemptSchema } from '@/schemas';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = SubmitAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await mockService.submit(id, session!.user.id, parsed.data);
    return apiSuccess(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Submission failed';
    return Response.json({ error: message }, { status: 422 });
  }
}
