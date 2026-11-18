import { and, asc, count, desc, eq, inArray, like, lte, ne, or, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { examNotificationExams, examNotifications, exams, users } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import type { NotificationCategory, NotificationStatus } from '@/lib/notifications';
import type { NotificationInput, NotificationPatch } from '@/schemas/notification.schema';

export type ExamNotification = typeof examNotifications.$inferSelect;

export interface NotificationExam {
  id: string;
  slug: string;
  name: string;
}

/** What public pages get: no author, status or internal timestamps beyond what's shown. */
export type PublicNotification = Pick<ExamNotification, 'id' | 'title' | 'slug' | 'summary' | 'category' | 'isImportant' | 'updatedAt'> & {
  publishedAt: Date;
};

const publicColumns = {
  id: examNotifications.id,
  title: examNotifications.title,
  slug: examNotifications.slug,
  summary: examNotifications.summary,
  category: examNotifications.category,
  isImportant: examNotifications.isImportant,
  publishedAt: examNotifications.publishedAt,
  updatedAt: examNotifications.updatedAt,
};

/**
 * Publicly visible = published and its publication time has arrived. Compared against a
 * JS Date (not SQL NOW()) so both sides go through the same driver UTC conversion,
 * whatever the DB session time zone is.
 */
function isLive(): SQL {
  return and(eq(examNotifications.status, 'PUBLISHED'), lte(examNotifications.publishedAt, new Date()))!;
}

function notificationIdsForExam(examId: string) {
  return db.select({ id: examNotificationExams.notificationId }).from(examNotificationExams).where(eq(examNotificationExams.examId, examId));
}

/** Exams (slug order, so "Class 10" before "Class 12") for each notification id. */
async function examsFor(ids: string[], activeOnly: boolean): Promise<Map<string, NotificationExam[]>> {
  const out = new Map<string, NotificationExam[]>();
  if (ids.length === 0) return out;
  const rows = await db
    .select({ notificationId: examNotificationExams.notificationId, id: exams.id, slug: exams.slug, name: exams.name })
    .from(examNotificationExams)
    .innerJoin(exams, eq(examNotificationExams.examId, exams.id))
    .where(and(inArray(examNotificationExams.notificationId, ids), activeOnly ? eq(exams.status, 'ACTIVE') : undefined))
    .orderBy(asc(exams.slug));
  for (const { notificationId, ...exam } of rows) {
    const list = out.get(notificationId) ?? [];
    list.push(exam);
    out.set(notificationId, list);
  }
  return out;
}

// ── Public reads (live only) ───────────────────────────────────────────────────

/** Live notifications for one exam, newest first, with the total for pagination. */
async function listPublishedByExam(examId: string, opts: { limit: number; offset?: number; category?: NotificationCategory | null }) {
  const where = and(
    isLive(),
    inArray(examNotifications.id, notificationIdsForExam(examId)),
    opts.category ? eq(examNotifications.category, opts.category) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(publicColumns)
      .from(examNotifications)
      .where(where)
      .orderBy(desc(examNotifications.publishedAt), desc(examNotifications.createdAt))
      .limit(opts.limit)
      .offset(opts.offset ?? 0),
    db.select({ total: count() }).from(examNotifications).where(where),
  ]);

  return { rows: rows as PublicNotification[], total: Number(total) };
}

/**
 * The home-page notification board: newest live notifications for an exam with their full
 * body (read in place — notifications have no pages of their own).
 */
async function listBoardByExam(examId: string, limit: number) {
  const rows = await db
    .select({ ...publicColumns, content: examNotifications.content, sourceUrl: examNotifications.sourceUrl })
    .from(examNotifications)
    .where(and(isLive(), inArray(examNotifications.id, notificationIdsForExam(examId))))
    .orderBy(desc(examNotifications.publishedAt), desc(examNotifications.createdAt))
    .limit(limit);
  return rows as (PublicNotification & { content: string; sourceUrl: string | null })[];
}

/** Newest live notification change per exam id — dates the exam home page in the sitemap. */
async function latestPublishedAtByExam(): Promise<Map<string, Date>> {
  const rows = await db
    .select({ examId: examNotificationExams.examId, updatedAt: examNotifications.updatedAt })
    .from(examNotifications)
    .innerJoin(examNotificationExams, eq(examNotificationExams.notificationId, examNotifications.id))
    .where(isLive());
  const out = new Map<string, Date>();
  for (const r of rows) {
    const prev = out.get(r.examId);
    if (!prev || r.updatedAt > prev) out.set(r.examId, r.updatedAt);
  }
  return out;
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export interface AdminNotificationFilters {
  q?: string;
  status?: NotificationStatus;
  category?: NotificationCategory;
  examId?: string;
  important?: boolean;
  page: number;
  pageSize: number;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function listAdmin(f: AdminNotificationFilters) {
  const term = f.q ? `%${escapeLike(f.q)}%` : null;
  const where = and(
    term ? or(like(examNotifications.title, term), like(examNotifications.summary, term), like(examNotifications.slug, term)) : undefined,
    f.status ? eq(examNotifications.status, f.status) : undefined,
    f.category ? eq(examNotifications.category, f.category) : undefined,
    f.important !== undefined ? eq(examNotifications.isImportant, f.important) : undefined,
    f.examId ? inArray(examNotifications.id, notificationIdsForExam(f.examId)) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ notification: examNotifications, createdByName: users.name })
      .from(examNotifications)
      .leftJoin(users, eq(examNotifications.createdBy, users.id))
      .where(where)
      // Drafts without a date sort with the newest (by creation) rather than sinking to the bottom.
      .orderBy(desc(examNotifications.publishedAt), desc(examNotifications.createdAt))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(examNotifications).where(where),
  ]);

  const examMap = await examsFor(
    rows.map((r) => r.notification.id),
    false,
  );
  return {
    rows: rows.map((r) => ({ ...r.notification, createdByName: r.createdByName, exams: examMap.get(r.notification.id) ?? [] })),
    total: Number(total),
  };
}

/** Exams notifications can be attached to: every ACTIVE exam. */
async function listEligibleExams(): Promise<NotificationExam[]> {
  return db.select({ id: exams.id, name: exams.name, slug: exams.slug }).from(exams).where(eq(exams.status, 'ACTIVE')).orderBy(asc(exams.name));
}

async function findById(id: string) {
  const [row] = await db.select().from(examNotifications).where(eq(examNotifications.id, id)).limit(1);
  if (!row) return null;
  const examMap = await examsFor([id], false);
  return { ...row, exams: examMap.get(id) ?? [] };
}

async function slugExists(slug: string, excludeId?: string) {
  const [row] = await db
    .select({ id: examNotifications.id })
    .from(examNotifications)
    .where(and(eq(examNotifications.slug, slug), excludeId ? ne(examNotifications.id, excludeId) : undefined))
    .limit(1);
  return !!row;
}

/** Slug from the title, suffixed (-2, -3…) until free. Non-Latin titles get a random slug. */
async function uniqueSlugFromTitle(title: string, excludeId?: string) {
  const base = slugify(title).slice(0, 200) || `notification-${crypto.randomUUID().slice(0, 8)}`;
  let slug = base;
  for (let n = 2; await slugExists(slug, excludeId); n++) slug = `${base}-${n}`;
  return slug;
}

function resolvePublishedAt(input: NotificationInput, existing: Date | null): Date | null {
  if (input.publishedAt) return new Date(input.publishedAt);
  // Publishing without a date means "now" (or keep the original date on re-publish).
  return input.status === 'PUBLISHED' ? (existing ?? new Date()) : null;
}

function toRow(input: NotificationInput) {
  return {
    title: input.title,
    summary: input.summary,
    content: input.content,
    category: input.category,
    status: input.status,
    isImportant: input.isImportant,
    sourceUrl: input.sourceUrl || null,
  };
}

async function create(input: NotificationInput, createdBy: string | null) {
  const id = crypto.randomUUID();
  const slug = input.slug || (await uniqueSlugFromTitle(input.title));
  // Timestamps from JS rather than the column's DEFAULT now(): the DB session zone isn't
  // UTC, so now() would be read back shifted. JS dates go through the same UTC conversion
  // as publishedAt, keeping all three comparable (sitemap lastmod, "updated" label).
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(examNotifications).values({ ...toRow(input), id, slug, publishedAt: resolvePublishedAt(input, null), createdBy, createdAt: now, updatedAt: now });
    await tx.insert(examNotificationExams).values([...new Set(input.examIds)].map((examId) => ({ notificationId: id, examId })));
  });
  return findById(id);
}

/** Full update. A blank slug keeps the current one, so editing a title never breaks its URL. */
async function update(id: string, input: NotificationInput, existing: ExamNotification) {
  await db.transaction(async (tx) => {
    await tx
      .update(examNotifications)
      .set({ ...toRow(input), slug: input.slug || existing.slug, publishedAt: resolvePublishedAt(input, existing.publishedAt), updatedAt: new Date() })
      .where(eq(examNotifications.id, id));
    await tx.delete(examNotificationExams).where(eq(examNotificationExams.notificationId, id));
    await tx.insert(examNotificationExams).values([...new Set(input.examIds)].map((examId) => ({ notificationId: id, examId })));
  });
  return findById(id);
}

/** Quick toggles from the list (publish/unpublish, important). */
async function patch(id: string, input: NotificationPatch, existing: ExamNotification) {
  await db
    .update(examNotifications)
    .set({
      ...input,
      ...(input.status === 'PUBLISHED' && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(examNotifications.id, id));
  return findById(id);
}

async function remove(id: string) {
  // Join rows go with it (ON DELETE CASCADE).
  await db.delete(examNotifications).where(eq(examNotifications.id, id));
}

export const notificationRepository = {
  listPublishedByExam,
  listBoardByExam,
  latestPublishedAtByExam,
  listAdmin,
  listEligibleExams,
  findById,
  create,
  update,
  patch,
  remove,
};
