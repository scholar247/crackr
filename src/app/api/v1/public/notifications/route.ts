import { z } from 'zod';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { NOTIFICATIONS_PAGE_SIZE, noticeHref, parseCategoryParam } from '@/lib/notifications';
import { apiError, apiSuccess } from '@/lib/utils';

const QuerySchema = z.object({
  exam: z.string({ error: 'exam is required' }).min(1, 'exam is required').max(200),
  category: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(NOTIFICATIONS_PAGE_SIZE),
});

// GET /api/v1/public/notifications?exam={examSlug}&category=&page=&limit=
// Live (published, publication time reached) notifications for an ACTIVE exam, newest
// first. Never returns drafts, scheduled rows or admin fields.
export async function GET(req: Request) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid query', 400);

  const { exam: examSlug, page, limit } = parsed.data;
  const exam = await taxonomyRepository.findExamBySlug(examSlug);
  if (!exam || exam.status !== 'ACTIVE') return apiError('Exam not found', 404);

  const category = parseCategoryParam(parsed.data.category);
  if (parsed.data.category && !category) return apiError('Unknown category', 400);

  const { rows, total } = await notificationRepository.listPublishedByExam(exam.id, { limit, offset: (page - 1) * limit, category });
  return apiSuccess(
    rows.map((n) => ({ ...n, url: noticeHref(exam.slug, n.slug) })),
    { total, page, limit },
  );
}
