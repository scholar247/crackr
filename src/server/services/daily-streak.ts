import { dailyQuestionRepository, type AttemptDay, type DailyStreakRow } from '@/server/repositories/daily-question.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { addDays, istDayKey, monthGrid, monthOf } from '@/lib/ist-date';

// Daily-question streaks. A day counts once the student answers that exam's question of
// the day (right or wrong — the habit is what matters; accuracy is reported separately).
// A streak stays alive through the current IST day: answering yesterday but not yet today
// still shows the streak, and it only resets once a whole day is missed.
//
// Reads are constant-cost: a summary is the counter row (daily_streaks) plus one month of
// days — never the student's whole history.

export interface StreakMonth {
  /** YYYY-MM. */
  month: string;
  days: { day: string; isCorrect: boolean }[];
}

export interface StreakSummary extends StreakMonth {
  /** IST day key the summary was computed for. */
  today: string;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  totalCorrect: number;
  /** First answered day (how far back the calendar can page), or null if none yet. */
  firstDay: string | null;
  /** Today's answer, if any — lets the page show it locked instead of asking again. */
  todayAttempt: { questionId: number | null; selected: string; isCorrect: boolean } | null;
}

function monthRange(month: string) {
  const { days } = monthGrid(month);
  return [days[0], days[days.length - 1]] as const;
}

/** Pure: counters + the current month's days → what the page shows. */
export function toSummary(streak: DailyStreakRow | null, monthDays: AttemptDay[], today: string): StreakSummary {
  // The stored streak is as of last_day; it's only still alive if that was today or yesterday.
  const alive = !!streak && streak.lastDay >= addDays(today, -1);
  const todayRow = monthDays.find((d) => d.day === today);
  return {
    today,
    month: monthOf(today),
    days: monthDays.map((d) => ({ day: d.day, isCorrect: d.isCorrect })),
    currentStreak: alive ? streak.currentStreak : 0,
    longestStreak: streak?.longestStreak ?? 0,
    totalSolved: streak?.totalSolved ?? 0,
    totalCorrect: streak?.totalCorrect ?? 0,
    firstDay: streak?.firstDay ?? null,
    todayAttempt: todayRow ? { questionId: todayRow.questionId, selected: todayRow.selectedOption, isCorrect: todayRow.isCorrect } : null,
  };
}

/** Counters + this month's calendar: two primary-key reads, in parallel. */
export async function getStreakSummary(userId: string, examId: string): Promise<StreakSummary> {
  const today = istDayKey();
  const [from, to] = monthRange(monthOf(today));
  const [streak, days] = await Promise.all([dailyQuestionRepository.getStreak(userId, examId), dailyQuestionRepository.listDays(userId, examId, from, to)]);
  return toSummary(streak, days, today);
}

/** One calendar month (≤ 31 rows, one PK range read) — loaded when the student pages back. */
export async function getStreakMonth(userId: string, examId: string, month: string): Promise<StreakMonth> {
  const [from, to] = monthRange(month);
  const days = await dailyQuestionRepository.listDays(userId, examId, from, to);
  return { month, days: days.map((d) => ({ day: d.day, isCorrect: d.isCorrect })) };
}

export type SubmitResult =
  | { ok: true; summary: StreakSummary; isCorrect: boolean; alreadyAnswered: boolean }
  | { ok: false; status: 400 | 404 | 409; error: string };

/**
 * Records a student's answer to today's question. The question must be *today's* question
 * for the exam (re-derived here, not trusted from the client) and correctness is decided
 * from the stored options. A second submit the same day keeps the first answer.
 */
export async function submitDailyAnswer(userId: string, examId: string, questionId: number, selected: string): Promise<SubmitResult> {
  const problem = await examSpotlightRepository.getDailyProblem(examId);
  if (!problem) return { ok: false, status: 404, error: 'There is no question of the day for this exam yet' };
  if (problem.id !== questionId) return { ok: false, status: 409, error: "Today's question has changed — refresh the page to see the new one" };

  const option = problem.options.find((o) => o.key === selected);
  if (!option) return { ok: false, status: 400, error: 'That option is not part of this question' };

  const today = istDayKey();
  let alreadyAnswered = false;
  try {
    await dailyQuestionRepository.recordAttempt({
      userId,
      examId,
      questionId,
      day: today,
      yesterday: addDays(today, -1),
      selectedOption: selected,
      isCorrect: option.isCorrect,
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    alreadyAnswered = true;
  }

  const summary = await getStreakSummary(userId, examId);
  return { ok: true, summary, isCorrect: summary.todayAttempt?.isCorrect ?? option.isCorrect, alreadyAnswered };
}
