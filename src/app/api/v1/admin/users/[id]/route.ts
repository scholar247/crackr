import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { UpdateUserSchema } from '@/schemas/user.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;

  const existing = await userRepository.findById(id);
  if (!existing) return apiError('Not found', 404);

  const parsed = UpdateUserSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const updated = await userRepository.update(id, parsed.data);
  return apiSuccess(updated);
}
