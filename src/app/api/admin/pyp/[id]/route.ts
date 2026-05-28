import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';
import { UpdatePYPSchema } from '@/schemas';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const pyp = await pypRepository.findById(id);
  if (!pyp) return apiError('PYP not found', 404);
  return apiSuccess(pyp);
}

export async function PATCH(req: Request, { params }: Params) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdatePYPSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const pyp = await pypRepository.update(id, parsed.data);
    if (!pyp) return apiError('PYP not found', 404);
    return apiSuccess(pyp);
  } catch (err) {
    console.error('[admin/pyp PATCH]', err);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  try {
    await pypRepository.softDelete(id);
    return apiSuccess({ ok: true });
  } catch (err) {
    console.error('[admin/pyp DELETE]', err);
    return apiError('Internal server error', 500);
  }
}
