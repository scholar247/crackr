import { mysqlTable, varchar, bigint, boolean, timestamp, date, int, index, primaryKey } from 'drizzle-orm/mysql-core';
import { users } from './identity';
import { exams } from './taxonomy';
import { questions } from './content';

// Question of the day + streaks. Designed so every hot-path read is a primary-key lookup or
// a short primary-key range, whatever the number of students or questions:
//
//   daily_questions          (exam_id, day) → question       one row per exam per day
//   daily_question_attempts  (user_id, exam_id, day) → answer one row per student per day
//   daily_streaks            (user_id, exam_id) → counters   one row per student per exam
//
// `day` is always the IST calendar day (YYYY-MM-DD, lib/ist-date.ts) in DATE string mode, so
// no time-zone conversion can shift it.

/**
 * The question chosen for each exam on each day — picked once (the first request of the
 * day) and then read by primary key, instead of scanning the exam's question pool on every
 * page view. Also keeps "today's question" stable when new questions are published mid-day.
 */
export const dailyQuestions = mysqlTable(
  'daily_questions',
  {
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    day: date('day', { mode: 'string' }).notNull(),
    questionId: bigint('question_id', { mode: 'number', unsigned: true }).references(() => questions.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.examId, table.day] })],
);

/**
 * One row per signed-in student, per exam, per day they answered. The natural key is the
 * clustered primary key, so a student's history is stored contiguously: a calendar month is
 * a single PK range read, and the key itself enforces one answer per day (a double submit
 * fails on insert). Correctness is decided on the server, never trusted from the client.
 * Deleting a question keeps the history (question_id → NULL) so past streaks don't break.
 */
export const dailyQuestionAttempts = mysqlTable(
  'daily_question_attempts',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    day: date('day', { mode: 'string' }).notNull(),
    questionId: bigint('question_id', { mode: 'number', unsigned: true }).references(() => questions.id, { onDelete: 'set null' }),
    selectedOption: varchar('selected_option', { length: 8 }).notNull(),
    isCorrect: boolean('is_correct').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.examId, table.day] }),
    // Backs the exam FK (MySQL needs an index on it) and per-exam/day reporting.
    index('daily_attempts_exam_day_idx').on(table.examId, table.day),
  ],
);

/**
 * Running streak counters per student per exam, updated atomically in the same transaction
 * as each attempt — so showing a streak is one primary-key read instead of re-reading and
 * re-computing a student's whole history on every page view.
 */
export const dailyStreaks = mysqlTable(
  'daily_streaks',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    /** Streak as of last_day; still "alive" while last_day is today or yesterday. */
    currentStreak: int('current_streak').notNull().default(0),
    longestStreak: int('longest_streak').notNull().default(0),
    totalSolved: int('total_solved').notNull().default(0),
    totalCorrect: int('total_correct').notNull().default(0),
    /** First answered day — how far back the calendar can page. */
    firstDay: date('first_day', { mode: 'string' }).notNull(),
    lastDay: date('last_day', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.examId] }), index('daily_streaks_exam_idx').on(table.examId)],
);
