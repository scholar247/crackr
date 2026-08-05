import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './identity';
import { exams } from './taxonomy';
import { questions } from './content';
import { audiences } from './audience';

// Schema only this phase — no API/UI built against these tables yet. Kept here now
// because the migration is cheap and avoids a painful later schema change; see the
// "Later phases" section of the revamp plan for the actual build order (assessment ->
// attempts -> access/sharing -> test series -> progress summaries -> analytics).

export const assessmentTypeEnum = pgEnum('assessment_type', ['MOCK', 'TEST', 'CHALLENGE', 'OFFICIAL']);
export const assessmentVisibilityEnum = pgEnum('assessment_visibility', [
  'PRIVATE',
  'UNLISTED',
  'PUBLIC',
  'RESTRICTED',
]);
export const assessmentStatusEnum = pgEnum('assessment_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const assessmentAccessTypeEnum = pgEnum('assessment_access_type', ['USER', 'AUDIENCE', 'PUBLIC', 'INVITE']);
export const assessmentAttemptStatusEnum = pgEnum('assessment_attempt_status', [
  'IN_PROGRESS',
  'SUBMITTED',
  'EXPIRED',
  'ABANDONED',
]);

// A mock, test, challenge, or official exam-like activity — one generic entity typed by
// `type` rather than separate top-level tables per use case (per the ERD's recommendation).
export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: assessmentTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  creatorUserId: uuid('creator_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  visibility: assessmentVisibilityEnum('visibility').notNull().default('PRIVATE'),
  status: assessmentStatusEnum('status').notNull().default('DRAFT'),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  durationSeconds: integer('duration_seconds'),
  scoringConfig: jsonb('scoring_config'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  maxAttempts: integer('max_attempts'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Questions included in an assessment, in order. `questionSnapshot` freezes the exact
// wording/options/answer/marks shown at publish time so later edits to the reusable
// question don't retroactively change how a past attempt is scored.
export const assessmentQuestions = pgTable(
  'assessment_questions',
  {
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    marks: numeric('marks').notNull().default('1'),
    negativeMarks: numeric('negative_marks').notNull().default('0'),
    questionSnapshot: jsonb('question_snapshot').notNull(),
    isOptional: boolean('is_optional').notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.assessmentId, table.questionId, table.position] })],
);

export const assessmentAccess = pgTable('assessment_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  accessType: assessmentAccessTypeEnum('access_type').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  audienceId: uuid('audience_id').references(() => audiences.id, { onDelete: 'cascade' }),
  inviteCodeHash: text('invite_code_hash'),
  availableFrom: timestamp('available_from', { withTimezone: true }),
  availableUntil: timestamp('available_until', { withTimezone: true }),
});

export const assessmentAttempts = pgTable('assessment_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull().default(1),
  status: assessmentAttemptStatusEnum('status').notNull().default('IN_PROGRESS'),
  score: numeric('score'),
  percentage: numeric('percentage'),
  timeSpentSeconds: integer('time_spent_seconds'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
});

export const attemptResponses = pgTable(
  'attempt_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    selectedOptionKeys: jsonb('selected_option_keys').$type<string[]>(),
    isCorrect: boolean('is_correct'),
    marksAwarded: numeric('marks_awarded'),
    timeSpentSeconds: integer('time_spent_seconds'),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('attempt_responses_attempt_question_idx').on(table.attemptId, table.questionId)],
);

// Ordered collection of assessments — a container, not a new content/question type.
export const testSeries = pgTable('test_series', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  creatorUserId: uuid('creator_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  visibility: assessmentVisibilityEnum('visibility').notNull().default('PRIVATE'),
  status: assessmentStatusEnum('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testSeriesItems = pgTable(
  'test_series_items',
  {
    seriesId: uuid('series_id')
      .notNull()
      .references(() => testSeries.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    unlockRule: jsonb('unlock_rule'),
    dueAt: timestamp('due_at', { withTimezone: true }),
  },
  (table) => [primaryKey({ columns: [table.seriesId, table.assessmentId] })],
);
