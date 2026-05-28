import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { groupRepository } from '@/server/repositories/group.repository';
import { UpdateGroupSchema } from '@/schemas';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const group = await groupRepository.update(id, parsed.data);
  if (!group) return apiError('Group not found', 404);
  return apiSuccess(group);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const deleted = await groupRepository.delete(id);
  if (!deleted) return apiError('Group not found', 404);
  return apiSuccess({ deleted: true });
}
