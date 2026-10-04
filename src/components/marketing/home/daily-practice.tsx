'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Timer, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogContent } from '@/components/blog/blog-content';
import { InlineMarkdown } from '@/components/questions/inline-markdown';
import type { DailyProblem } from '@/server/repositories/exam-spotlight.repository';
import { DIFFICULTY_COLORS, cn } from '@/lib/utils';

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))} : ${pad(Math.floor((total % 3600) / 60))} : ${pad(total % 60)}`;
}

function Countdown({ until }: { until: string }) {
  // null until mounted so server and client markup match.
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const target = new Date(until).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
      <Timer className="h-4 w-4 text-primary" />
      <div>
        <p className="text-label-caps text-muted-foreground">Next problem in</p>
        <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {remaining === null ? '-- : -- : --' : formatRemaining(remaining)}
        </p>
      </div>
    </div>
  );
}

interface DailyPracticeProps {
  examName: string;
  examSlug: string;
  problem: DailyProblem | null;
  loading?: boolean;
}

export function DailyPractice({ examName, examSlug, problem, loading }: DailyPracticeProps) {
  // Keyed on the problem id so switching exams starts each problem fresh.
  const [state, setState] = useState<{ problemId: number | null; picked: string | null; verified: boolean }>({
    problemId: null,
    picked: null,
    verified: false,
  });
  const current = state.problemId === problem?.id ? state : { problemId: problem?.id ?? null, picked: null, verified: false };

  if (loading) return <Skeleton className="h-56 rounded-xl" />;

  if (!problem) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary">
          <Zap className="h-3.5 w-3.5" /> Daily practice problem
        </p>
        <p className="text-body-sm text-muted-foreground">
          Yet, no practice problems are published for {examName}. Check back soon, or browse what&apos;s available.
        </p>
        <Link href={`/exams/${examSlug}`} className="text-sm font-semibold text-primary hover:underline">
          View {examName} →
        </Link>
      </div>
    );
  }

  const correct = problem.options.find((o) => o.isCorrect);
  const gotItRight = current.verified && current.picked === correct?.key;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary">
            <Zap className="h-3.5 w-3.5" /> Daily practice problem
          </p>
          <h3 className="text-headline-md mt-1 text-foreground">Try today&apos;s {examName} problem</h3>
        </div>
        <Countdown until={problem.nextRefreshAt} />
      </div>

      <div className="mt-5 grid gap-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-muted/60 p-4 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div>
          <Badge className={cn(DIFFICULTY_COLORS[problem.difficulty])}>{problem.difficulty}</Badge>
          <div className="mt-3 text-base font-medium text-foreground">
            <BlogContent content={problem.stem} />
          </div>
        </div>

        <div>
          <div className="grid gap-2 sm:grid-cols-2">
            {problem.options.map((option) => {
              const isPicked = current.picked === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={current.verified}
                  onClick={() => setState({ problemId: problem.id, picked: option.key, verified: false })}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border bg-card px-3.5 py-3 text-left text-sm transition-colors',
                    !current.verified && !isPicked && 'border-border hover:border-primary/40',
                    !current.verified && isPicked && 'border-primary bg-primary/5',
                    current.verified && option.isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                    current.verified && isPicked && !option.isCorrect && 'border-destructive/50 bg-destructive/10',
                    current.verified && !isPicked && !option.isCorrect && 'border-border opacity-60',
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-medium">
                    {option.key}
                  </span>
                  <InlineMarkdown content={option.text} className="flex-1 text-foreground" />
                  {current.verified && option.isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                  {current.verified && isPicked && !option.isCorrect && <X className="h-4 w-4 shrink-0 text-destructive" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full"
              disabled={!current.picked || current.verified}
              onClick={() => setState({ ...current, verified: true })}
            >
              Verify solution
            </Button>
            <p className="text-body-sm text-muted-foreground">
              {current.verified
                ? gotItRight
                  ? 'Correct — nice work.'
                  : `Not quite — the answer is ${correct?.key}.`
                : 'Select an option to check your understanding.'}
            </p>
          </div>
        </div>

        {current.verified && problem.explanation && (
          <div className="rounded-lg bg-card p-4 text-sm text-muted-foreground lg:col-span-2">
            <BlogContent content={problem.explanation} />
          </div>
        )}
      </div>

      <Link href={`/exams/${examSlug}?tab=subjects`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Practice more {examName} MCQs →
      </Link>
    </div>
  );
}
