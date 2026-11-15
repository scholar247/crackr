import { and, between, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { dailyQuestionAttempts, dailyQuestions, dailyStreaks } from '@/server/db/schema';

// Every query here is a primary-key lookup or a short primary-key range, so cost stays flat
// as students and questions grow:
//   picks     daily_questions          PK (exam_id, day)
//   attempts  daily_question_attempts  PK (user_id, exam_id, day)  — month = one range read
//   streaks   daily_streaks            PK (user_id, exam_id)

export type DailyStreakRow = typeof dailyStreaks.$inferSelect;

export interface AttemptDay {
  day: string;
  isCorrect: boolean;
  selectedOption: string;
  questionId: number | null;
}

// ── Daily question picks ───────────────────────────────────────────────────────

async function findPick(examId: string, day: string): Promise<number | null | undefined> {
  const [row] = await db
    .select({ questionId: dailyQuestions.questionId })
    .from(dailyQuestions)
    .where(and(eq(dailyQuestions.examId, examId), eq(dailyQuestions.day, day)))
    .limit(1);
  // undefined = no pick yet today; null = picked question was deleted.
  return row ? row.questionId : undefined;
}

/**
 * Stores today's pick unless another request already did (first writer wins, across all
 * server instances), and returns whichever pick is stored.
 */
async function savePick(examId: string, day: string, questionId: number): Promise<number> {
  await db
    .insert(dailyQuestions)
    .values({ examId, day, questionId, createdAt: new Date() })
    .onDuplicateKeyUpdate({ set: { examId: sql`${dailyQuestions.examId}` } }); // no-op: keep the existing pick
  return (await findPick(examId, day)) ?? questionId;
}

/** Replaces today's pick (the stored one was unpublished or deleted mid-day). */
async function replacePick(examId: string, day: string, questionId: number) {
  await db
    .update(dailyQuestions)
    .set({ questionId })
    .where(and(eq(dailyQuestions.examId, examId), eq(dailyQuestions.day, day)));
}

// ── Attempts & streaks ─────────────────────────────────────────────────────────

async function getStreak(userId: string, examId: string): Promise<DailyStreakRow | null> {
  const [row] = await db
    .select()
    .from(dailyStreaks)
    .where(and(eq(dailyStreaks.userId, userId), eq(dailyStreaks.examId, examId)))
    .limit(1);
  return row ?? null;
}

/** A student's answered days between two day keys (inclusive) — one PK range read. */
async function listDays(userId: string, examId: string, from: string, to: string): Promise<AttemptDay[]> {
  return db
    .select({
      day: dailyQuestionAttempts.day,
      isCorrect: dailyQuestionAttempts.isCorrect,
      selectedOption: dailyQuestionAttempts.selectedOption,
      questionId: dailyQuestionAttempts.questionId,
    })
    .from(dailyQuestionAttempts)
    .where(and(eq(dailyQuestionAttempts.userId, userId), eq(dailyQuestionAttempts.examId, examId), between(dailyQuestionAttempts.day, from, to)))
    .orderBy(dailyQuestionAttempts.day);
}

/**
 * Saves an answer and advances the streak counters in one transaction. The attempt insert
 * runs first: a second answer the same day violates its primary key and throws, so the
 * counters are only ever advanced once per day.
 *
 * The counter update is a single atomic upsert (no read-modify-write race). MySQL applies
 * ON DUPLICATE KEY UPDATE assignments left to right, each seeing the previous ones, so the
 * ORDER BELOW MATTERS: current_streak reads the *old* last_day, longest_streak reads the
 * *new* current_streak, and last_day is updated last.
 */
async function recordAttempt(input: { userId: string; examId: string; questionId: number; day: string; yesterday: string; selectedOption: string; isCorrect: boolean }) {
  const now = new Date(); // JS timestamps: the DB session zone isn't UTC, so DEFAULT now() would read back shifted
  const correct = input.isCorrect ? 1 : 0;
  // Raw SQL params are formatted by the driver in the *server's* zone; Drizzle's typed
  // columns write UTC. Pass the same UTC 'YYYY-MM-DD HH:MM:SS' Drizzle would.
  const nowUtc = now.toISOString().slice(0, 19).replace('T', ' ');
  await db.transaction(async (tx) => {
    await tx.insert(dailyQuestionAttempts).values({
      userId: input.userId,
      examId: input.examId,
      day: input.day,
      questionId: input.questionId,
      selectedOption: input.selectedOption,
      isCorrect: input.isCorrect,
      createdAt: now,
    });
    await tx.execute(sql`
      INSERT INTO daily_streaks (user_id, exam_id, current_streak, longest_streak, total_solved, total_correct, first_day, last_day, updated_at)
      VALUES (${input.userId}, ${input.examId}, 1, 1, 1, ${correct}, ${input.day}, ${input.day}, ${nowUtc})
      ON DUPLICATE KEY UPDATE
        current_streak = IF(last_day = ${input.yesterday}, current_streak + 1, 1),
        longest_streak = GREATEST(longest_streak, current_streak),
        total_solved = total_solved + 1,
        total_correct = total_correct + ${correct},
        last_day = ${input.day},
        updated_at = ${nowUtc}
    `);
  });
}

export const dailyQuestionRepository = { findPick, savePick, replacePick, getStreak, listDays, recordAttempt };
