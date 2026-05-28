import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { mcqService } from '@/server/services/mcq.service';
import { UpdateMCQSchema } from '@/schemas';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const mcq = await mcqService.getById(id);
  if (!mcq) return apiError('MCQ not found', 404);
  return apiSuccess(mcq);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateMCQSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const mcq = await mcqService.update(id, parsed.data, session!.user.id);
  if (!mcq) return apiError('MCQ not found', 404);
  return apiSuccess(mcq);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const deleted = await mcqService.delete(id);
  if (!deleted) return apiError('MCQ not found', 404);
  return apiSuccess({ deleted: true });
}
