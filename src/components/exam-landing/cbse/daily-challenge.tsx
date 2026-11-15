'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { toast } from 'sonner';
import { DailyPractice } from '@/components/marketing/home/daily-practice';
import type { DailyProblem } from '@/server/repositories/exam-spotlight.repository';
import type { StreakSummary } from '@/server/services/daily-streak';
import { StreakCalendar } from './streak-calendar';

// ── Guest answer held until sign-in ────────────────────────────────────────────
// A guest can answer today's question; their answer waits in localStorage and is saved
// automatically once they sign in — if it's still the same IST day and question.

const PENDING_KEY = 'daily-question-pending';

interface PendingAnswer {
  examSlug: string;
  day: string;
  questionId: number;
  picked: string;
}

const pendingListeners = new Set<() => void>();
let pendingCache: { raw: string | null; value: PendingAnswer | null } = { raw: null, value: null };

function readPending(): PendingAnswer | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
  if (raw !== pendingCache.raw) {
    let value: PendingAnswer | null = null;
    try {
      value = raw ? (JSON.parse(raw) as PendingAnswer) : null;
    } catch {
      value = null;
    }
    pendingCache = { raw, value };
  }
  return pendingCache.value;
}

function writePending(value: PendingAnswer | null) {
  try {
    if (value) localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage blocked: the guest just won't get the auto-save after sign-in.
  }
  for (const listener of pendingListeners) listener();
}

function subscribePending(onChange: () => void) {
  pendingListeners.add(onChange);
  return () => pendingListeners.delete(onChange);
}

// ── Saving ─────────────────────────────────────────────────────────────────────

type SubmitResponse = { summary: StreakSummary; isCorrect: boolean; alreadyAnswered: boolean };

async function postAnswer(examSlug: string, questionId: number, selected: string): Promise<SubmitResponse> {
  const res = await fetch(`/api/v1/daily-question/${encodeURIComponent(examSlug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, selected }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Could not save your answer');
  return json.data as SubmitResponse;
}

const MILESTONES = new Set([3, 7, 14, 30, 50, 100, 200, 365]);

function celebrate(before: number, summary: StreakSummary, isCorrect: boolean) {
  const n = summary.currentStreak;
  const verdict = isCorrect ? 'Correct!' : 'Answer saved.';
  if (MILESTONES.has(n) && n > before) {
    toast.success(`🔥 ${n}-day streak — milestone!`, { description: `${verdict} You've answered ${n} days in a row. Keep it up tomorrow.` });
  } else if (n > before) {
    toast.success(`🔥 ${n}-day streak`, { description: `${verdict} Come back tomorrow for the next question.` });
  } else {
    toast.success(verdict, { description: 'Saved to your streak calendar.' });
  }
}

// The question of the day at full width, then the streak calendar beside whatever cards
// the page adds (progress, next steps). Signed-in answers are saved to the server, which
// decides correctness; the calendar updates from the server's reply.
export function DailyChallenge({
  examSlug,
  classLabel,
  problem,
  practiceHref,
  signedIn,
  signInHref,
  today,
  initialSummary,
  children,
}: {
  examSlug: string;
  classLabel: string;
  problem: DailyProblem | null;
  practiceHref: string;
  signedIn: boolean;
  signInHref: string;
  /** Server's IST day key. */
  today: string;
  initialSummary: StreakSummary | null;
  children: ReactNode;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [saving, setSaving] = useState(false);
  const pending = useSyncExternalStore(subscribePending, readPending, () => null);
  const pendingForToday = pending && problem && pending.examSlug === examSlug && pending.day === today && pending.questionId === problem.id ? pending : null;

  const save = useCallback(
    async (questionId: number, picked: string, opts: { fromGuest?: boolean } = {}) => {
      const before = summary?.currentStreak ?? 0;
      try {
        const result = await postAnswer(examSlug, questionId, picked);
        setSummary(result.summary);
        if (opts.fromGuest) toast.success('Saved the answer you gave before signing in', { description: `🔥 ${result.summary.currentStreak}-day streak` });
        else if (!result.alreadyAnswered) celebrate(before, result.summary, result.isCorrect);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save your answer');
      } finally {
        setSaving(false);
      }
    },
    [examSlug, summary?.currentStreak],
  );

  // After signing in: save the answer a guest gave earlier today (once).
  const autoSaved = useRef(false);
  useEffect(() => {
    if (!signedIn || autoSaved.current || !pendingForToday || summary?.todayAttempt) return;
    autoSaved.current = true;
    writePending(null);
    void save(pendingForToday.questionId, pendingForToday.picked, { fromGuest: true });
  }, [signedIn, pendingForToday, summary?.todayAttempt, save]);

  const onVerified = (_correct: boolean, picked: string) => {
    if (!problem) return;
    if (!signedIn) {
      writePending({ examSlug, day: today, questionId: problem.id, picked });
      return;
    }
    setSaving(true);
    void save(problem.id, picked);
  };

  // Open locked on an answer already given today (saved, or held for a guest).
  const savedToday = summary?.todayAttempt && problem && summary.todayAttempt.questionId === problem.id ? summary.todayAttempt.selected : null;
  const answeredPick = savedToday ?? (!signedIn ? pendingForToday?.picked : null) ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <DailyPractice
          examName={classLabel}
          examSlug={examSlug}
          problem={problem}
          practiceHref={practiceHref}
          onVerified={onVerified}
          answered={answeredPick ? { picked: answeredPick } : null}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {problem && (
          <StreakCalendar examSlug={examSlug} summary={summary} today={today} signedIn={signedIn} signInHref={signInHref} guestAnswered={!!pendingForToday} saving={saving} />
        )}
        {children}
      </div>
    </div>
  );
}
