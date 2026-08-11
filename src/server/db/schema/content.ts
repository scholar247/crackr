import { mysqlTable, mysqlEnum, varchar, text, json, bigint, timestamp, uniqueIndex } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';
import { curriculumNodes, exams } from './taxonomy';

// Shared across every content-bearing entity — this is the mechanism for "public vs
// private content": public routes only ever query status=PUBLISHED AND visibility=PUBLIC.
export const CONTENT_TYPES = ['QUESTION', 'ARTICLE'] as const;
export const CONTENT_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
const CONTENT_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'AUDIENCE_RESTRICTED'] as const;
const CONTENT_RELATION_TYPES = ['PRIMARY', 'SUPPLEMENTARY', 'PRACTICE'] as const;

export interface QuestionOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

// MCQ-first per the ERD: options travel with the question as a JSON array rather than a
// separate question_option table, so stem/options/answer are always fetched together.
// id is a numeric auto-increment (not UUID) — content rows are internal, never used as an
// opaque public identifier the way a program/exam/user id might be, so a short numeric id
// is both simpler to work with and enough.
export const questions = mysqlTable('questions', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  questionType: mysqlEnum('question_type', ['MCQ']).notNull().default('MCQ'),
  stem: text('stem').notNull(),
  optionsJson: json('options_json').$type<QuestionOption[]>().notNull(),
  explanation: text('explanation'),
  difficulty: mysqlEnum('difficulty', ['EASY', 'MEDIUM', 'HARD', 'EXPERT']).notNull().default('MEDIUM'),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  // Freeform labels (e.g. "2024 Pattern") — separate from the structured curriculum
  // node tagging in content_node_map, which is what drives syllabus-scoped queries.
  tags: json('tags').$type<string[]>(),
  status: mysqlEnum('status', CONTENT_STATUSES).notNull().default('DRAFT'),
  visibility: mysqlEnum('visibility', CONTENT_VISIBILITIES).notNull().default('PRIVATE'),
  authorId: varchar('author_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  // Who made the most recent write, distinct from authorId (who created it). Nullable for
  // the same reason authorId is: rows created before this column existed, or written via
  // the service-key/seed-script identity which has no backing users row.
  updatedBy: varchar('updated_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Standalone article — this is the table backing the kept blog editor/renderer. Same
// numeric-id reasoning as questions above.
export const articles = mysqlTable(
  'articles',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    title: varchar('title', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull(),
    summary: text('summary'),
    body: text('body').notNull(), // markdown, rendered by src/components/blog/blog-content.tsx
    language: varchar('language', { length: 10 }).notNull().default('en'),
    status: mysqlEnum('status', CONTENT_STATUSES).notNull().default('DRAFT'),
    visibility: mysqlEnum('visibility', CONTENT_VISIBILITIES).notNull().default('PRIVATE'),
    // SEO metadata — all optional, independent of title/summary so editors can override
    // what search engines/social previews see without changing the on-page copy.
    metaTitle: varchar('meta_title', { length: 160 }),
    metaDescription: varchar('meta_description', { length: 320 }),
    keywords: json('keywords').$type<string[]>(),
    ogImage: varchar('og_image', { length: 2048 }),
    authorId: varchar('author_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    updatedBy: varchar('updated_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('articles_slug_idx').on(table.slug)],
);

// Polymorphic: contentId points at questions.id or articles.id depending on contentType.
// No cross-table FK constraint is possible for that (standard tradeoff of the ERD's
// "one unified mapping table" design over a table-per-combination scheme) — contentId is
// bigint unsigned to match both content tables' id type, even though nothing enforces
// which one at the DB level.
export const contentNodeMap = mysqlTable(
  'content_node_map',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    contentType: mysqlEnum('content_type', CONTENT_TYPES).notNull(),
    contentId: bigint('content_id', { mode: 'number', unsigned: true }).notNull(),
    nodeId: varchar('node_id', { length: 36 })
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    relationType: mysqlEnum('relation_type', CONTENT_RELATION_TYPES).notNull().default('PRIMARY'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_node_map_unique_idx').on(
      table.contentType,
      table.contentId,
      table.nodeId,
      table.relationType,
    ),
  ],
);

// Direct content <-> exam shortcut for content that's exam-level rather than topic-level.
export const contentExamMap = mysqlTable(
  'content_exam_map',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    contentType: mysqlEnum('content_type', CONTENT_TYPES).notNull(),
    contentId: bigint('content_id', { mode: 'number', unsigned: true }).notNull(),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    relationType: mysqlEnum('relation_type', CONTENT_RELATION_TYPES).notNull().default('PRIMARY'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_exam_map_unique_idx').on(table.contentType, table.contentId, table.examId, table.relationType),
  ],
);
