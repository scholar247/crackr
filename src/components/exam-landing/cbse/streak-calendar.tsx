'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Flame, LogIn, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { addMonths, dayLabel, monthGrid, monthLabel, monthOf } from '@/lib/ist-date';
import type { StreakMonth, StreakSummary } from '@/server/services/daily-streak';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

async function fetchMonth(examSlug: string, month: string): Promise<StreakMonth> {
  const res = await fetch(`/api/v1/daily-question/${encodeURIComponent(examSlug)}?month=${month}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Could not load this month');
  return json.data as StreakMonth;
}

// Month calendar of answered days (LeetCode-style): green check = answered correctly,
// amber = answered but wrong, ringed = today. Header shows the current and best streak;
// footer says what to do next. Guests see the calendar dimmed behind a sign-in prompt.
// The current month arrives with the page; earlier months are fetched (≤ 31 rows each)
// only when the student pages back, and cached.
export function StreakCalendar({
  examSlug,
  summary,
  today,
  signedIn,
  signInHref,
  guestAnswered,
  saving,
}: {
  examSlug: string;
  summary: StreakSummary | null;
  /** Server's IST day key, so server and client render the same month. */
  today: string;
  signedIn: boolean;
  signInHref: string;
  /** A guest answered today; their answer is held until they sign in. */
  guestAnswered: boolean;
  saving: boolean;
}) {
  const thisMonth = monthOf(today);
  const [month, setMonth] = useState(thisMonth);
  const isCurrent = month === thisMonth;
  const past = useQuery({
    queryKey: ['daily-streak-month', examSlug, month],
    queryFn: () => fetchMonth(examSlug, month),
    enabled: signedIn && !isCurrent,
    staleTime: 10 * 60 * 1000, // past months don't change
  });
  const monthDays = isCurrent ? summary?.days : past.data?.days;
  const answered = useMemo(() => new Map((monthDays ?? []).map((d) => [d.day, d.isCorrect])), [monthDays]);

  const earliest = summary?.firstDay ? monthOf(summary.firstDay) : thisMonth;
  const { leading, days } = monthGrid(month);
  const monthSolved = days.filter((d) => answered.has(d)).length;

  const streak = summary?.currentStreak ?? 0;
  const doneToday = !!summary?.todayAttempt;
  const accuracy = summary && summary.totalSolved > 0 ? Math.round((summary.totalCorrect / summary.totalSolved) * 100) : null;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Streak header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', streak > 0 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground')}>
            <Flame className={cn('h-5 w-5', streak > 0 && 'fill-warning/40')} aria-hidden />
          </span>
          <div>
            <p className="text-2xl leading-none font-bold text-foreground tabular-nums" aria-live="polite">
              {streak}
              <span className="ml-1 text-sm font-medium text-muted-foreground">day streak</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {!signedIn ? 'Sign in to track your streak' : saving ? 'Saving your answer…' : doneToday ? 'Solved today ✓' : streak > 0 ? 'Answer today to keep it going' : 'Answer today to start one'}
            </p>
          </div>
        </div>
        {summary && summary.longestStreak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground" title="Longest streak">
            <Trophy className="h-3.5 w-3.5" aria-hidden /> Best {summary.longestStreak}
          </span>
        )}
      </div>

      {/* Month calendar */}
      <div
        className={cn('px-5 pt-4 pb-3 transition-opacity', !signedIn && 'pointer-events-none opacity-40 blur-[1px] select-none', past.isFetching && 'opacity-60')}
        aria-hidden={!signedIn || undefined}
        aria-busy={past.isFetching || undefined}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            disabled={month <= earliest}
            aria-label="Previous month"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-foreground">
            {monthLabel(month)}
            {monthSolved > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{monthSolved} solved</span>}
          </p>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            disabled={month >= thisMonth}
            aria-label="Next month"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`${monthLabel(month)} streak calendar`}>
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="pb-1 text-[10px] font-semibold uppercase text-muted-foreground" aria-hidden>
              {w}
            </span>
          ))}
          {Array.from({ length: leading }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden />
          ))}
          {days.map((d) => {
            const result = answered.get(d);
            const isToday = d === today;
            const future = d > today;
            const label = `${dayLabel(d)}${result === true ? ', answered correctly' : result === false ? ', answered (incorrect)' : future ? '' : ', not answered'}${isToday ? ' — today' : ''}`;
            return (
              <span
                key={d}
                role="gridcell"
                aria-label={label}
                title={label}
                className={cn(
                  'relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs tabular-nums transition-colors',
                  result === true && 'bg-emerald-500 font-semibold text-white',
                  result === false && 'bg-warning/20 font-semibold text-warning ring-1 ring-warning/50',
                  result === undefined && !future && 'text-foreground',
                  future && 'text-muted-foreground/40',
                  isToday && result === undefined && 'ring-2 ring-primary ring-offset-1 ring-offset-card font-semibold text-primary',
                )}
              >
                {result === true ? <Check className="h-3.5 w-3.5" aria-hidden /> : Number(d.slice(8))}
              </span>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground" aria-hidden>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Correct
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning/40 ring-1 ring-warning/60" /> Attempted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-primary" /> Today
          </span>
        </div>
      </div>

      {/* Totals / next step */}
      {signedIn ? (
        <div className="mt-auto grid grid-cols-2 border-t border-border text-center">
          <div className="px-3 py-3">
            <p className="text-lg font-semibold text-foreground tabular-nums">{summary?.totalSolved ?? 0}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Days solved</p>
          </div>
          <div className="border-l border-border px-3 py-3">
            <p className="text-lg font-semibold text-foreground tabular-nums">{accuracy === null ? '—' : `${accuracy}%`}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Accuracy</p>
          </div>
          {!doneToday && (
            <a
              href="#daily"
              className="col-span-2 flex items-center justify-center gap-1.5 border-t border-border py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              <Target className="h-4 w-4" aria-hidden /> Answer today&apos;s question
            </a>
          )}
        </div>
      ) : (
        // Sign-in prompt over the dimmed calendar.
        <div className="absolute inset-x-0 bottom-0 top-[4.75rem] flex flex-col items-center justify-center gap-3 bg-card/70 px-6 text-center backdrop-blur-[1px]">
          <p className="font-semibold text-foreground">{guestAnswered ? 'Save today’s answer' : 'Build a daily streak'}</p>
          <p className="text-body-sm max-w-[16rem] text-muted-foreground">
            {guestAnswered
              ? 'Sign in and your answer is saved automatically — your streak starts today.'
              : 'Sign in to save every answer, keep a streak and see your calendar fill up.'}
          </p>
          <Button size="sm" className="rounded-full" asChild>
            <Link href={signInHref}>
              <LogIn className="h-4 w-4" /> Sign in to save streak
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
