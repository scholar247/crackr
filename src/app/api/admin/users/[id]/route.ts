import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';
import { UserRoleSchema } from '@/schemas';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: UserRoleSchema.optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;

  if (id === session!.user.id) {
    return apiError('Cannot edit your own account here', 400);
  }

  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  // Only SUPER_ADMIN can change roles
  if (parsed.data.role !== undefined && session!.user.role !== 'SUPER_ADMIN') {
    return apiError('Only super admins can change roles', 403);
  }

  const updated = await userRepository.updateDetails(id, parsed.data);
  if (!updated) return apiError('User not found', 404);
  return apiSuccess({ updated: true });
}
