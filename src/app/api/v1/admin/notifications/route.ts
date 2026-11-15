import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { AdminNotificationQuerySchema, NotificationSchema } from '@/schemas/notification.schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { apiError, apiSuccess } from '@/lib/utils';

// GET /api/v1/admin/notifications?q=&status=&category=&examId=&important=&page=&pageSize=
export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const params = Object.fromEntries([...new URL(req.url).searchParams].filter(([, v]) => v !== ''));
  const parsed = AdminNotificationQuerySchema.safeParse(params);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid query', 400);

  const { important, ...filters } = parsed.data;
  const [{ rows, total }, exams] = await Promise.all([
    notificationRepository.listAdmin({ ...filters, important: important === undefined ? undefined : important === 'true' }),
    notificationRepository.listEligibleExams(),
  ]);
  return apiSuccess(rows, { total, page: filters.page, pageSize: filters.pageSize, exams });
}

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = NotificationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const eligible = new Set((await notificationRepository.listEligibleExams()).map((e) => e.id));
  if (parsed.data.examIds.some((id) => !eligible.has(id))) return apiError('Notifications can only be attached to active exams', 400);

  try {
    const createdBy = isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id;
    const notification = await notificationRepository.create(parsed.data, createdBy);
    return apiSuccess(notification, undefined, 201);
  } catch (err) {
    if (isDuplicateKeyError(err)) return apiError('That slug is already used by another notification', 409);
    throw err;
  }
}
