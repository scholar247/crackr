import { pgTable, pgEnum, uuid, text, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './identity';
import { curriculumNodes, exams } from './taxonomy';

// Shared across every content-bearing entity — this is the mechanism for "public vs
// private content": public routes only ever query status=PUBLISHED AND visibility=PUBLIC.
export const contentTypeEnum = pgEnum('content_type', ['QUESTION', 'ARTICLE']);
export const contentStatusEnum = pgEnum('content_status', ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']);
export const contentVisibilityEnum = pgEnum('content_visibility', ['PUBLIC', 'PRIVATE', 'AUDIENCE_RESTRICTED']);
export const contentRelationTypeEnum = pgEnum('content_relation_type', ['PRIMARY', 'SUPPLEMENTARY', 'PRACTICE']);

export const questionTypeEnum = pgEnum('question_type', ['MCQ']);
export const difficultyEnum = pgEnum('difficulty', ['EASY', 'MEDIUM', 'HARD', 'EXPERT']);

export interface QuestionOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

// MCQ-first per the ERD: options travel with the question as a JSONB array rather than a
// separate question_option table, so stem/options/answer are always fetched together.
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionType: questionTypeEnum('question_type').notNull().default('MCQ'),
  stem: text('stem').notNull(),
  optionsJson: jsonb('options_json').$type<QuestionOption[]>().notNull(),
  explanation: text('explanation'),
  difficulty: difficultyEnum('difficulty').notNull().default('MEDIUM'),
  language: text('language').notNull().default('en'),
  status: contentStatusEnum('status').notNull().default('DRAFT'),
  visibility: contentVisibilityEnum('visibility').notNull().default('PRIVATE'),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Standalone article — this is the table backing the kept blog editor/renderer.
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    summary: text('summary'),
    body: text('body').notNull(), // markdown, rendered by src/components/blog/blog-content.tsx
    language: text('language').notNull().default('en'),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    visibility: contentVisibilityEnum('visibility').notNull().default('PRIVATE'),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('articles_slug_idx').on(table.slug)],
);

// Polymorphic: contentId points at questions.id or articles.id depending on contentType.
// No cross-table FK constraint is possible for that (standard tradeoff of the ERD's
// "one unified mapping table" design over a table-per-combination scheme).
export const contentNodeMap = pgTable(
  'content_node_map',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentType: contentTypeEnum('content_type').notNull(),
    contentId: uuid('content_id').notNull(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    relationType: contentRelationTypeEnum('relation_type').notNull().default('PRIMARY'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
export const contentExamMap = pgTable(
  'content_exam_map',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentType: contentTypeEnum('content_type').notNull(),
    contentId: uuid('content_id').notNull(),
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    relationType: contentRelationTypeEnum('relation_type').notNull().default('PRIMARY'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_exam_map_unique_idx').on(table.contentType, table.contentId, table.examId, table.relationType),
  ],
);
