import { requireAuth } from '@/server/auth/require-auth';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { NotificationPatchSchema, NotificationSchema } from '@/schemas/notification.schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { apiError, apiSuccess } from '@/lib/utils';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const notification = await notificationRepository.findById((await params).id);
  if (!notification) return apiError('Not found', 404);
  return apiSuccess(notification);
}

// Full update — the edit form always submits the whole record.
export async function PUT(req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const existing = await notificationRepository.findById(id);
  if (!existing) return apiError('Not found', 404);

  const parsed = NotificationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  // New exam links must be active; links to an exam archived since stay allowed so the
  // notification remains editable.
  const allowed = new Set([...(await notificationRepository.listEligibleExams()).map((e) => e.id), ...existing.exams.map((e) => e.id)]);
  if (parsed.data.examIds.some((examId) => !allowed.has(examId))) return apiError('Notifications can only be attached to active exams', 400);

  try {
    return apiSuccess(await notificationRepository.update(id, parsed.data, existing));
  } catch (err) {
    if (isDuplicateKeyError(err)) return apiError('That slug is already used by another notification', 409);
    throw err;
  }
}

// Partial update for list toggles: { status } and/or { isImportant }.
export async function PATCH(req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const existing = await notificationRepository.findById(id);
  if (!existing) return apiError('Not found', 404);

  const parsed = NotificationPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  return apiSuccess(await notificationRepository.patch(id, parsed.data, existing));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const existing = await notificationRepository.findById(id);
  if (!existing) return apiError('Not found', 404);

  await notificationRepository.remove(id);
  return apiSuccess({ id });
}
