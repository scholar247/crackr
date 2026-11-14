import { mysqlTable, mysqlEnum, varchar, int, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { exams } from './taxonomy';
import { users } from './identity';

// Board sample papers (CBSE Class 10 / 12 today), one row per exam + year + subject.
// Public pages live at /exams/{exam.slug}/sample-papers/{year}/{subjectSlug}, so
// `subjectSlug` is stored (derived from `subject` on write) and unique per exam + year.
//
// `year` is the board exam year (2026 = the 2025-26 session), not the release date —
// see sessionLabel() in src/lib/sample-papers.ts for how it is displayed.
//
// The two links are either internal media URLs (/api/v1/media/{slug}/content, uploaded
// from the admin panel) or absolute http(s) URLs (e.g. cbseacademic.nic.in). Neither is
// ever shown to visitors: the viewer reads PDFs through
// /api/v1/public/sample-papers/{id}/file so the source stays hidden.
export const samplePapers = mysqlTable(
  'sample_papers',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    year: int('year').notNull(),
    subject: varchar('subject', { length: 120 }).notNull(),
    subjectSlug: varchar('subject_slug', { length: 140 }).notNull(),
    samplePaperLink: varchar('sample_paper_link', { length: 2048 }).notNull(),
    markingSchemeLink: varchar('marking_scheme_link', { length: 2048 }),
    // Lets admins stage a paper before it goes live; unpublished rows 404 publicly.
    isPublished: boolean('is_published').notNull().default(true),
    createdBy: varchar('created_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sample_papers_exam_year_subject_idx').on(table.examId, table.year, table.subjectSlug),
    index('sample_papers_exam_published_idx').on(table.examId, table.isPublished, table.year),
  ],
);

export const SAMPLE_PAPER_DOCS = ['PAPER', 'SCHEME'] as const;

// One row per download (downloads require sign-in — see
// /api/v1/sample-papers/{id}/download). Rows go with the paper or the user when either is
// deleted. Deliberately no IP address: user + time + client is enough to report on and
// spot abuse, without holding more personal data than needed.
export const samplePaperDownloads = mysqlTable(
  'sample_paper_downloads',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    samplePaperId: varchar('sample_paper_id', { length: 36 })
      .notNull()
      .references(() => samplePapers.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    document: mysqlEnum('document', SAMPLE_PAPER_DOCS).notNull(),
    userAgent: varchar('user_agent', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('sample_paper_downloads_paper_idx').on(table.samplePaperId, table.createdAt),
    index('sample_paper_downloads_user_idx').on(table.userId, table.createdAt),
  ],
);
