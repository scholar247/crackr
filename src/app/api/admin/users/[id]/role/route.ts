import { requireAuth, isSuperAdmin } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';
import { UpdateUserRoleSchema } from '@/schemas';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth('SUPER_ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Prevent demoting yourself
  if (id === session!.user.id) {
    return apiError('Cannot change your own role', 400);
  }

  const updated = await userRepository.updateRole(id, parsed.data.role);
  if (!updated) return apiError('User not found', 404);
  return apiSuccess({ updated: true });
}
