'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bookmark, Eraser, ChevronLeft, ChevronRight, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogContent } from '@/components/blog/blog-content';
import { InlineMarkdown } from '@/components/questions/inline-markdown';
import { QuestionNavigator } from '@/components/mocks/question-navigator';
import { cn } from '@/lib/utils';

interface QuestionView {
  questionId: number;
  sectionId: string | null;
  marks: string;
  negativeMarks: string;
  stem: string;
  options: { key: string; text: string }[];
  difficulty: string;
  selectedOptionKeys?: string[];
  markedForReview: boolean;
}

interface AttemptState {
  attempt: { id: string; status: string };
  deadline: string | null;
  questions: QuestionView[];
}

interface SectionInfo {
  id: string;
  title: string;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data;
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function ExamRoomClient({
  assessmentId,
  attemptId,
  sections,
}: {
  assessmentId: string;
  attemptId: string;
  sections: SectionInfo[];
}) {
  const router = useRouter();
  const [state, setState] = useState<AttemptState | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string | undefined>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<number, boolean>>({});
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  // Per-question time tracking — commitElapsedSeconds rolls time since the last commit
  // into the running total and resets this clock, so it doubles as "time since entering
  // the current question."
  const enteredAtRef = useRef(Date.now());
  const timeSpentRef = useRef<Record<number, number>>({});

  const load = useCallback(async () => {
    const data: AttemptState = await fetchJson(`/api/v1/assessments/${assessmentId}/attempts/${attemptId}`);
    if (data.attempt.status !== 'IN_PROGRESS') {
      router.replace(`/mocks/${assessmentId}/results/${attemptId}`);
      return;
    }
    setState(data);
    setSelections(Object.fromEntries(data.questions.map((q) => [q.questionId, q.selectedOptionKeys?.[0]])));
    setReviewFlags(Object.fromEntries(data.questions.map((q) => [q.questionId, q.markedForReview])));
  }, [assessmentId, attemptId, router]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questions = useMemo(() => state?.questions ?? [], [state]);
  const current = questions[index];

  async function persist(questionId: number, patch: { selectedOptionKeys?: string[]; markedForReview?: boolean; timeSpentSeconds?: number }) {
    try {
      await fetchJson(`/api/v1/assessments/${assessmentId}/attempts/${attemptId}/responses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, ...patch }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your answer');
    }
  }

  // Rolls whatever time has elapsed since the last commit for this question into its
  // running total and resets the clock — called on every explicit answer action AND on
  // navigation away, so time is captured even for questions the student only read and
  // never answered (a real attemptResponses row still gets written for those, with an
  // empty selectedOptionKeys, so the time isn't silently lost).
  function commitElapsedSeconds(questionId: number) {
    const elapsed = Math.round((Date.now() - enteredAtRef.current) / 1000);
    timeSpentRef.current[questionId] = (timeSpentRef.current[questionId] ?? 0) + elapsed;
    enteredAtRef.current = Date.now();
    return timeSpentRef.current[questionId];
  }

  // Sends the full known state for a question (selection + review flag + accumulated
  // time) rather than a partial patch, so a time-only commit on navigation can never
  // clobber an answer that was set earlier.
  function saveQuestionState(questionId: number, overrides: { selectedOptionKeys?: string[]; markedForReview?: boolean } = {}) {
    const selectedOptionKeys = overrides.selectedOptionKeys ?? (selections[questionId] ? [selections[questionId]!] : []);
    const markedForReview = overrides.markedForReview ?? (reviewFlags[questionId] ?? false);
    return persist(questionId, { selectedOptionKeys, markedForReview, timeSpentSeconds: commitElapsedSeconds(questionId) });
  }

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      if (current) await saveQuestionState(current.questionId);
      await fetchJson(`/api/v1/assessments/${assessmentId}/attempts/${attemptId}/submit`, { method: 'POST' });
      router.push(`/mocks/${assessmentId}/results/${attemptId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit');
      submittedRef.current = false;
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, attemptId, router, current, selections, reviewFlags]);

  // Countdown, ticking client-side from the server-provided deadline; the server is still
  // authoritative (saveResponse/submit both re-check the deadline independently), this is
  // purely the on-screen timer plus a courtesy auto-submit when it hits zero.
  useEffect(() => {
    if (!state?.deadline) return;
    const deadline = new Date(state.deadline).getTime();
    const tick = () => {
      const remaining = deadline - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) submit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [state?.deadline, submit]);

  // Warn on tab close/refresh while an attempt is genuinely in progress — losing the
  // in-memory index/selection state is recoverable (saved server-side) but jarring.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const navigatorQuestions = useMemo(
    () => questions.map((q) => ({ questionId: q.questionId, answered: Boolean(selections[q.questionId]), markedForReview: Boolean(reviewFlags[q.questionId]) })),
    [questions, selections, reviewFlags]
  );

  const currentSectionTitle = useMemo(() => {
    if (!current) return '';
    return sections.find((s) => s.id === current.sectionId)?.title ?? '';
  }, [current, sections]);

  function selectOption(key: string) {
    if (!current) return;
    setSelections((prev) => ({ ...prev, [current.questionId]: key }));
    saveQuestionState(current.questionId, { selectedOptionKeys: [key] });
  }

  function clearAnswer() {
    if (!current) return;
    setSelections((prev) => ({ ...prev, [current.questionId]: undefined }));
    saveQuestionState(current.questionId, { selectedOptionKeys: [] });
  }

  function toggleReview() {
    if (!current) return;
    const next = !reviewFlags[current.questionId];
    setReviewFlags((prev) => ({ ...prev, [current.questionId]: next }));
    saveQuestionState(current.questionId, { markedForReview: next });
  }

  function goTo(nextIndex: number) {
    if (current) saveQuestionState(current.questionId);
    setIndex(nextIndex);
  }

  if (!state || !current) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading exam room…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current section</p>
          <p className="text-sm font-semibold text-foreground">{currentSectionTitle || 'Mock exam'}</p>
        </div>
        <div className="flex items-center gap-3">
          {remainingMs !== null && (
            <span className={cn('rounded-md border px-3 py-1.5 font-mono text-sm', remainingMs < 60_000 ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-muted/50 text-foreground')}>
              {formatDuration(remainingMs)}
            </span>
          )}
          <Link href="#" className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex">
            <LifeBuoy className="h-4 w-4" /> Support
          </Link>
          <Button variant="destructive" size="sm" onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
            <span className="text-xs text-muted-foreground">
              +{Number(current.marks)} Marks / -{Number(current.negativeMarks)} Penalty
            </span>
          </div>

          <div className="mt-4">
            <BlogContent content={current.stem} />
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {current.options.map((option) => {
              const isSelected = selections[current.questionId] === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectOption(option.key)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                    isSelected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-muted/30 text-foreground hover:bg-muted/50'
                  )}
                >
                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                    {option.key}
                  </span>
                  <InlineMarkdown content={option.text} />
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={clearAnswer} disabled={!selections[current.questionId]}>
                <Eraser className="h-4 w-4" /> Clear
              </Button>
              <Button variant={reviewFlags[current.questionId] ? 'secondary' : 'outline'} onClick={toggleReview}>
                <Bookmark className="h-4 w-4" /> Mark for Review
              </Button>
              <Button onClick={() => goTo(Math.min(questions.length - 1, index + 1))} disabled={index === questions.length - 1}>
                Save & Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <QuestionNavigator questions={navigatorQuestions} currentIndex={index} onSelect={goTo} />
      </div>
    </div>
  );
}
