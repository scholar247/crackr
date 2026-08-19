import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, ListChecks, CheckCircle2, XCircle, Circle, Timer, TrendingUp, BarChart3 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { Button } from '@/components/ui/button';
import { AttemptReview } from '@/components/mocks/attempt-review';
import { cn } from '@/lib/utils';

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

function proficiencyBand(pct: number): string {
  if (pct >= 85) return 'Excellent';
  if (pct >= 70) return 'Proficient';
  if (pct >= 50) return 'Developing';
  return 'Needs Improvement';
}

const DIFFICULTY_ORDER = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;
const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard', EXPERT: 'Expert' };
const DIFFICULTY_BAR_CLASS: Record<string, string> = {
  EASY: 'bg-emerald-500',
  MEDIUM: 'bg-tertiary',
  HARD: 'bg-destructive',
  EXPERT: 'bg-destructive',
};

export default async function ResultsPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const session = await auth();
  const { id, attemptId } = await params;

  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) notFound();

  let summary;
  try {
    summary = await assessmentRepository.getResultsSummary(id, attemptId, session!.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === 'ATTEMPT_IN_PROGRESS') redirect(`/mocks/${id}/room?attempt=${attemptId}`);
    notFound();
  }

  const assessment = await assessmentRepository.findById(id);
  if (!assessment) notFound();

  // getAttemptState reveals correct answers once the attempt is no longer IN_PROGRESS —
  // reused here as the review-list data source rather than re-deriving it.
  const attemptState = await assessmentRepository.getAttemptState(id, attemptId, session!.user.id);
  const questions = attemptState.questions;

  const comparison = assessment.type === 'CHALLENGE' ? await assessmentRepository.getChallengeComparison(id, session!.user.id).catch(() => null) : null;

  // Percentile against the rest of the group — only meaningful when there's an actual
  // cohort to compare against (a TEST with more than one completed attempt); a solo mock
  // or a still-empty group test has no peer group, so this stays null rather than faking one.
  let percentileText: string | null = null;
  if (assessment.type === 'TEST') {
    const report = await assessmentRepository.getAssessmentReport(id);
    if (report.completedCount > 1) {
      const score = Number(summary.attempt.score ?? 0);
      const below = report.ranking.filter((r) => r.attemptId !== attemptId && r.score < score).length;
      const percentile = Math.round((below / (report.completedCount - 1)) * 100);
      percentileText = `You performed better than ${percentile}% of participants in this test.`;
    }
  }

  const totalDuration = assessment.durationSeconds ?? 0;
  const timeUsed = summary.attempt.timeSpentSeconds ?? 0;

  const correctCount = questions.filter((q) => q.isCorrect === true).length;
  const wrongCount = questions.filter((q) => q.isCorrect === false).length;
  const maxMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);
  const score = Number(summary.attempt.score ?? 0);
  const scorePct = maxMarks > 0 ? Math.max(0, Math.min(100, (score / maxMarks) * 100)) : 0;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (scorePct / 100) * circumference;

  const accuracyPct = summary.attemptedCount > 0 ? (correctCount / summary.attemptedCount) * 100 : 0;
  const avgSecondsPerQuestion = summary.attemptedCount > 0 ? timeUsed / summary.attemptedCount : 0;

  const timedQuestions = questions.filter((q) => q.selectedOptionKeys?.length && q.timeSpentSeconds != null);
  const speedBuckets = { fast: 0, optimal: 0, slow: 0 };
  for (const q of timedQuestions) {
    const mins = (q.timeSpentSeconds ?? 0) / 60;
    if (mins < 2) speedBuckets.fast += 1;
    else if (mins <= 3) speedBuckets.optimal += 1;
    else speedBuckets.slow += 1;
  }
  const speedTotal = speedBuckets.fast + speedBuckets.optimal + speedBuckets.slow;
  const speedPct = {
    fast: speedTotal ? (speedBuckets.fast / speedTotal) * 100 : 0,
    optimal: speedTotal ? (speedBuckets.optimal / speedTotal) * 100 : 0,
    slow: speedTotal ? (speedBuckets.slow / speedTotal) * 100 : 0,
  };

  const byDifficulty = DIFFICULTY_ORDER.map((difficulty) => {
    const inGroup = questions.filter((q) => q.difficulty === difficulty);
    const correct = inGroup.filter((q) => q.isCorrect === true).length;
    return { difficulty, total: inGroup.length, correct };
  }).filter((g) => g.total > 0);
  const maxGroupTotal = Math.max(1, ...byDifficulty.map((g) => g.total));
  const weakest = byDifficulty.length
    ? [...byDifficulty].sort((a, b) => (a.total ? a.correct / a.total : 1) - (b.total ? b.correct / b.total : 1))[0]
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-foreground">Assessment Summary</h1>
          <p className="mt-1 text-sm text-muted-foreground">{assessment.title}</p>
        </div>
        <Button asChild>
          <a href="#review">
            <ClipboardCheck className="h-4 w-4" /> Review Question-by-Question
          </a>
        </Button>
      </div>

      {comparison && comparison.challenger.attempt && comparison.opponent.attempt && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Head-to-head</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[comparison.challenger, comparison.opponent].map((side) => {
              const isChampion = comparison.championUserId === side.id;
              return (
                <div key={side.id} className={cn('rounded-lg border p-4 text-center', isChampion ? 'border-primary bg-primary/10' : 'border-border')}>
                  {isChampion && <p className="text-xs font-semibold uppercase tracking-wide text-primary">Champion</p>}
                  <p className="mt-1 font-medium text-foreground">{side.name ?? 'Player'}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{Number(side.attempt?.score ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{formatDuration(side.attempt?.timeSpentSeconds ?? 0)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Score card */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-4">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-muted" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="stroke-emerald-500 transition-all"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display-lg text-display-lg leading-none text-foreground">{score}</span>
              <span className="mt-1 text-label-caps uppercase tracking-widest text-muted-foreground">out of {maxMarks}</span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="font-headline-md text-headline-md text-foreground">{proficiencyBand(scorePct)}</h2>
            {percentileText && <p className="mt-2 text-sm text-muted-foreground">{percentileText}</p>}
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:col-span-8">
          <KpiCard icon={ListChecks} label="Attempted" value={summary.attemptedCount} sub={`/${summary.totalQuestions}`} />
          <KpiCard icon={CheckCircle2} label="Correct" value={correctCount} accentClassName="bg-emerald-500" iconClassName="text-emerald-500" labelClassName="text-emerald-600 dark:text-emerald-400" />
          <KpiCard icon={XCircle} label="Wrong" value={wrongCount} accentClassName="bg-destructive" iconClassName="text-destructive" labelClassName="text-destructive" />
          <KpiCard icon={Circle} label="Unattempted" value={summary.skippedCount} />
          <div className="col-span-2 flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm md:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Timer className="h-[18px] w-[18px]" />
              <span className="text-label-caps uppercase tracking-wider">Time Taken</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-lg text-headline-lg text-foreground">{formatDuration(timeUsed)}</span>
              {totalDuration > 0 && <span className="text-sm text-muted-foreground">/ {formatDuration(totalDuration)} total</span>}
            </div>
            {totalDuration > 0 && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (timeUsed / totalDuration) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance metrics */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-label-md font-label-md text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" /> Performance Metrics
          </h3>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm text-muted-foreground">Overall Accuracy</span>
                <span className="font-headline-md text-headline-md text-foreground">{Math.round(accuracyPct)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${accuracyPct}%` }} />
              </div>
            </div>
            {speedTotal > 0 && (
              <div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">Average Speed</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-foreground">{(avgSecondsPerQuestion / 60).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">min / q</span>
                  </div>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  {speedPct.fast > 0 && <div className="h-full bg-emerald-500" style={{ width: `${speedPct.fast}%` }} />}
                  {speedPct.optimal > 0 && <div className="h-full bg-tertiary" style={{ width: `${speedPct.optimal}%` }} />}
                  {speedPct.slow > 0 && <div className="h-full bg-destructive" style={{ width: `${speedPct.slow}%` }} />}
                </div>
                <div className="mt-2 flex justify-between text-label-caps uppercase text-muted-foreground">
                  <span>Fast (&lt;2m)</span>
                  <span>Optimal</span>
                  <span>Slow (&gt;3m)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Difficulty breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-label-md font-label-md text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" /> Difficulty Breakdown
          </h3>
          {byDifficulty.length > 0 ? (
            <>
              <div className="mb-4 flex h-40 items-end gap-4">
                {byDifficulty.map((g) => {
                  const containerHeightPct = (g.total / maxGroupTotal) * 100;
                  const fillHeightPct = g.total > 0 ? (g.correct / g.total) * 100 : 0;
                  return (
                    <div key={g.difficulty} className="group flex flex-1 flex-col justify-end">
                      <div className="mb-2 text-center text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        {g.correct}/{g.total}
                      </div>
                      <div className="relative w-full overflow-hidden rounded-t-md bg-muted" style={{ height: `${containerHeightPct}%` }}>
                        <div className={cn('absolute bottom-0 w-full opacity-80', DIFFICULTY_BAR_CLASS[g.difficulty])} style={{ height: `${fillHeightPct}%` }} />
                      </div>
                      <div className="mt-3 text-center text-label-caps uppercase text-muted-foreground">{DIFFICULTY_LABEL[g.difficulty]}</div>
                    </div>
                  );
                })}
              </div>
              {weakest && weakest.total > weakest.correct && (
                <div className="flex justify-between border-t border-border pt-3 text-sm text-muted-foreground">
                  <span>
                    Focus Area: <span className="font-medium text-destructive">{DIFFICULTY_LABEL[weakest.difficulty]} Questions</span>
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No difficulty data for this attempt.</p>
          )}
        </div>
      </div>

      {summary.sectionBreakdown.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Section Breakdown</p>
          <div className="mt-4 space-y-4">
            {summary.sectionBreakdown.map((s) => (
              <div key={s.sectionId}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{s.title}</span>
                  <span className="text-muted-foreground">
                    {s.attempted}/{s.total} attempted · {formatDuration(s.timeSpentSeconds)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.total > 0 ? (s.attempted / s.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="review" className="mt-8 scroll-mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Review your answers</p>
        <div className="mt-3">
          <AttemptReview questions={questions} />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline">
          <Link href="/mocks">Back to My Mocks</Link>
        </Button>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accentClassName,
  iconClassName,
  labelClassName,
}: {
  icon: typeof ListChecks;
  label: string;
  value: number;
  sub?: string;
  accentClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
      {accentClassName && <div className={cn('absolute inset-y-0 left-0 w-1', accentClassName)} />}
      <div className={cn('mb-3 flex items-center gap-2 text-muted-foreground', accentClassName && 'pl-2')}>
        <Icon className={cn('h-[18px] w-[18px]', iconClassName)} />
        <span className={cn('text-label-caps uppercase tracking-wider', labelClassName)}>{label}</span>
      </div>
      <div className={cn('font-headline-lg text-headline-lg text-foreground', accentClassName && 'pl-2')}>
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
