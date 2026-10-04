import { requireAuth } from '@/server/auth/require-auth';
import { pageCardRepository } from '@/server/repositories/page-card.repository';
import { apiError, apiSuccess } from '@/lib/utils';
import { PageCardSchema } from '@/lib/page-card-schema';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  // The form always submits the full card, so validate against the full schema.
  const parsed = PageCardSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const card = await pageCardRepository.update(id, parsed.data);
  if (!card) return apiError('Not found', 404);
  return apiSuccess(card);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  await pageCardRepository.remove(id);
  return apiSuccess({ id });
}
