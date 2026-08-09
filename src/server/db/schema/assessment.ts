import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  int,
  bigint,
  decimal,
  json,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';
import { exams } from './taxonomy';
import { questions } from './content';
import { audiences } from './audience';

// Schema only this phase — no API/UI built against these tables yet. Kept here now
// because the migration is cheap and avoids a painful later schema change; see the
// "Later phases" section of the revamp plan for the actual build order (assessment ->
// attempts -> access/sharing -> test series -> progress summaries -> analytics).

const ASSESSMENT_VISIBILITIES = ['PRIVATE', 'UNLISTED', 'PUBLIC', 'RESTRICTED'] as const;
const ASSESSMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

// A mock, test, challenge, or official exam-like activity — one generic entity typed by
// `type` rather than separate top-level tables per use case (per the ERD's recommendation).
export const assessments = mysqlTable('assessments', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  type: mysqlEnum('type', ['MOCK', 'TEST', 'CHALLENGE', 'OFFICIAL']).notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  description: text('description'),
  creatorUserId: varchar('creator_user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  visibility: mysqlEnum('visibility', ASSESSMENT_VISIBILITIES).notNull().default('PRIVATE'),
  status: mysqlEnum('status', ASSESSMENT_STATUSES).notNull().default('DRAFT'),
  examId: varchar('exam_id', { length: 36 }).references(() => exams.id, { onDelete: 'set null' }),
  durationSeconds: int('duration_seconds'),
  scoringConfig: json('scoring_config'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  maxAttempts: int('max_attempts'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Questions included in an assessment, in order. `questionSnapshot` freezes the exact
// wording/options/answer/marks shown at publish time so later edits to the reusable
// question don't retroactively change how a past attempt is scored.
export const assessmentQuestions = mysqlTable(
  'assessment_questions',
  {
    assessmentId: varchar('assessment_id', { length: 36 })
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    questionId: bigint('question_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    position: int('position').notNull(),
    marks: decimal('marks', { precision: 6, scale: 2 }).notNull().default('1'),
    negativeMarks: decimal('negative_marks', { precision: 6, scale: 2 }).notNull().default('0'),
    questionSnapshot: json('question_snapshot').notNull(),
    isOptional: boolean('is_optional').notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.assessmentId, table.questionId, table.position] })],
);

export const assessmentAccess = mysqlTable('assessment_access', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  assessmentId: varchar('assessment_id', { length: 36 })
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  accessType: mysqlEnum('access_type', ['USER', 'AUDIENCE', 'PUBLIC', 'INVITE']).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  audienceId: varchar('audience_id', { length: 36 }).references(() => audiences.id, { onDelete: 'cascade' }),
  inviteCodeHash: varchar('invite_code_hash', { length: 255 }),
  availableFrom: timestamp('available_from'),
  availableUntil: timestamp('available_until'),
});

export const assessmentAttempts = mysqlTable('assessment_attempts', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  assessmentId: varchar('assessment_id', { length: 36 })
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  attemptNumber: int('attempt_number').notNull().default(1),
  status: mysqlEnum('status', ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED']).notNull().default('IN_PROGRESS'),
  score: decimal('score', { precision: 8, scale: 2 }),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  timeSpentSeconds: int('time_spent_seconds'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
});

export const attemptResponses = mysqlTable(
  'attempt_responses',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    attemptId: varchar('attempt_id', { length: 36 })
      .notNull()
      .references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
    questionId: bigint('question_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    selectedOptionKeys: json('selected_option_keys').$type<string[]>(),
    isCorrect: boolean('is_correct'),
    marksAwarded: decimal('marks_awarded', { precision: 6, scale: 2 }),
    timeSpentSeconds: int('time_spent_seconds'),
    answeredAt: timestamp('answered_at'),
  },
  (table) => [uniqueIndex('attempt_responses_attempt_question_idx').on(table.attemptId, table.questionId)],
);

// Ordered collection of assessments — a container, not a new content/question type.
export const testSeries = mysqlTable('test_series', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  title: varchar('title', { length: 160 }).notNull(),
  description: text('description'),
  creatorUserId: varchar('creator_user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  visibility: mysqlEnum('visibility', ASSESSMENT_VISIBILITIES).notNull().default('PRIVATE'),
  status: mysqlEnum('status', ASSESSMENT_STATUSES).notNull().default('DRAFT'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const testSeriesItems = mysqlTable(
  'test_series_items',
  {
    seriesId: varchar('series_id', { length: 36 })
      .notNull()
      .references(() => testSeries.id, { onDelete: 'cascade' }),
    assessmentId: varchar('assessment_id', { length: 36 })
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    position: int('position').notNull(),
    unlockRule: json('unlock_rule'),
    dueAt: timestamp('due_at'),
  },
  (table) => [primaryKey({ columns: [table.seriesId, table.assessmentId] })],
);
