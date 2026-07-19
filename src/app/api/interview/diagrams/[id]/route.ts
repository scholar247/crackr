import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { interviewService } from '@/server/services/interview.service';
import { UpdateDiagramSchema } from '@/schemas/interview.schema';

function errorStatus(message: string): number {
  if (message === 'Forbidden') return 403;
  if (message === 'Diagram not found') return 404;
  return 400;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const result = await interviewService.getWithAccess(id, session?.user?.id ?? null);
  if (!result) return apiError('Diagram not found', 404);
  return apiSuccess(result);
}

// Session is optional — see the TODO(auth) note on `interviewService.update`.
// A PUBLIC diagram (which is every diagram right now) can be edited by
// anyone with the link; a PRIVATE one still requires real owner/editor access.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const body = await req.json();
  const parsed = UpdateDiagramSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const diagram = await interviewService.update(id, parsed.data, session?.user?.id ?? null);
    return apiSuccess(diagram);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return Response.json({ error: message }, { status: errorStatus(message) });
  }
}

// Deletion stays behind real auth even in public mode — it's destructive,
// and unlike editing there's no in-progress UI relying on anonymous access.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  try {
    await interviewService.delete(id, session!.user.id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return Response.json({ error: message }, { status: errorStatus(message) });
  }
}
