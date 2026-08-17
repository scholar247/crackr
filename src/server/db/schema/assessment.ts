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
import { exams, curriculumNodes } from './taxonomy';
import { questions } from './content';
import { audiences } from './audience';

// Backs the mock-test platform (self mocks, group tests, 1v1 challenges) — see
// src/server/repositories/assessment.repository.ts for the algorithms built on top.

const ASSESSMENT_VISIBILITIES = ['PRIVATE', 'UNLISTED', 'PUBLIC', 'RESTRICTED'] as const;
const ASSESSMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
// FIXED: every participant starts at the same instant (assessments.startsAt/endsAt is
// that exact shared window). FLEXIBLE: startsAt/endsAt is an outer window and each
// participant can click Start any time inside it, getting the full durationSeconds from
// their own start. CHALLENGE-type assessments leave startsAt null until "Start Now"
// locks it (same shared-deadline mechanism, reusing this column rather than a new one).
const ASSESSMENT_SCHEDULING_MODES = ['FIXED', 'FLEXIBLE'] as const;

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
  schedulingMode: mysqlEnum('scheduling_mode', ASSESSMENT_SCHEDULING_MODES).notNull().default('FLEXIBLE'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  maxAttempts: int('max_attempts'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// One row per subject/chapter (or an ad-hoc "Section A") pulled into an assessment —
// the unit that carries requested question count, difficulty filter, and the
// positive/negative marks every question in it is frozen with at build time. nodeId
// null means "pull from anywhere in the exam," not "no section" — every assessment
// built by this platform has at least one section, even a single implicit one.
export const assessmentSections = mysqlTable('assessment_sections', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  assessmentId: varchar('assessment_id', { length: 36 })
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 160 }).notNull(),
  nodeId: varchar('node_id', { length: 36 }).references(() => curriculumNodes.id, { onDelete: 'set null' }),
  position: int('position').notNull(),
  questionCount: int('question_count').notNull(),
  difficulty: mysqlEnum('difficulty', ['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  defaultMarks: decimal('default_marks', { precision: 6, scale: 2 }).notNull().default('1'),
  defaultNegativeMarks: decimal('default_negative_marks', { precision: 6, scale: 2 }).notNull().default('0'),
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
    sectionId: varchar('section_id', { length: 36 }).references(() => assessmentSections.id, { onDelete: 'set null' }),
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
  // Chosen when the attempt is *started*, not when the assessment is configured — the
  // same self-mock config can be retaken once "for real" and once "just to practice."
  // Always true for TEST/CHALLENGE attempts (the API forces this).
  countsTowardProgress: boolean('counts_toward_progress').notNull().default(true),
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
    markedForReview: boolean('marked_for_review').notNull().default(false),
    answeredAt: timestamp('answered_at'),
  },
  (table) => [uniqueIndex('attempt_responses_attempt_question_idx').on(table.attemptId, table.questionId)],
);

// 1:1 with a CHALLENGE-type assessment — the accept/decline lifecycle for a 1v1. The
// shared start moment itself lives on assessments.startsAt (reused, not duplicated here)
// so both the "everyone starts together" group-FIXED path and the challenge path share
// one mechanism.
const CHALLENGE_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'] as const;

export const assessmentChallenges = mysqlTable('assessment_challenges', {
  assessmentId: varchar('assessment_id', { length: 36 })
    .primaryKey()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  challengerUserId: varchar('challenger_user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  opponentUserId: varchar('opponent_user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: mysqlEnum('status', CHALLENGE_STATUSES).notNull().default('PENDING'),
  respondedAt: timestamp('responded_at'),
});

// An invite by email where no account exists yet. Kept separate from assessmentAccess
// (which always references a real users row) rather than making userId nullable there —
// this table's entire lifecycle is "wait for a signup, then convert." claimPendingInvitesForEmail
// (assessment.repository.ts) is called from user.repository.ts's provisionGoogleUser right
// after a brand-new account is created, converting matching PENDING rows into real
// assessmentAccess rows.
const PENDING_INVITE_STATUSES = ['PENDING', 'CLAIMED', 'REVOKED'] as const;

export const assessmentPendingInvites = mysqlTable(
  'assessment_pending_invites',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    assessmentId: varchar('assessment_id', { length: 36 })
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 320 }).notNull(), // stored lowercased
    invitedByUserId: varchar('invited_by_user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: mysqlEnum('status', PENDING_INVITE_STATUSES).notNull().default('PENDING'),
    claimedByUserId: varchar('claimed_by_user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    claimedAt: timestamp('claimed_at'),
    availableFrom: timestamp('available_from'),
    availableUntil: timestamp('available_until'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('assessment_pending_invites_email_status_idx').on(table.email, table.status, table.assessmentId)],
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
