import { mysqlTable, mysqlEnum, varchar, text, boolean, timestamp, uniqueIndex, index, primaryKey } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { exams } from './taxonomy';
import { users } from './identity';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_STATUSES } from '@/lib/notifications';

// Exam notifications (CBSE circulars, date sheets, results…) shown on exam landing pages
// at /exams/{exam.slug}/notifications/{slug}. Which exams a notification belongs to lives in
// `exam_notification_exams`, so one row can serve Class 10, Class 12 or both without
// duplicating content — and any other exam can adopt notifications without a schema change.
//
// Public visibility = status PUBLISHED *and* publishedAt <= now, so setting a future
// publishedAt schedules a notification. Drafts and scheduled rows 404 publicly.
export const examNotifications = mysqlTable(
  'exam_notifications',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    title: varchar('title', { length: 200 }).notNull(),
    // Globally unique (not per exam): a notification shared by two exams has one slug.
    slug: varchar('slug', { length: 220 }).notNull(),
    /** One- or two-sentence summary shown in lists and as the meta description. */
    summary: varchar('summary', { length: 500 }).notNull(),
    /** Full notification body (Markdown). */
    content: text('content').notNull(),
    category: mysqlEnum('category', NOTIFICATION_CATEGORIES).notNull().default('GENERAL'),
    status: mysqlEnum('status', NOTIFICATION_STATUSES).notNull().default('DRAFT'),
    isImportant: boolean('is_important').notNull().default(false),
    /** Link to the official circular (e.g. cbse.gov.in PDF), shown as the source. */
    sourceUrl: varchar('source_url', { length: 2048 }),
    publishedAt: timestamp('published_at'),
    createdBy: varchar('created_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('exam_notifications_slug_idx').on(table.slug),
    index('exam_notifications_status_published_idx').on(table.status, table.publishedAt),
  ],
);

export const examNotificationExams = mysqlTable(
  'exam_notification_exams',
  {
    notificationId: varchar('notification_id', { length: 36 })
      .notNull()
      .references(() => examNotifications.id, { onDelete: 'cascade' }),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.notificationId, table.examId] }), index('exam_notification_exams_exam_idx').on(table.examId)],
);
