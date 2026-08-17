import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Check, X } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { BlogContent } from '@/components/blog/blog-content';
import { InlineMarkdown } from '@/components/questions/inline-markdown';
import { DIFFICULTY_COLORS, cn } from '@/lib/utils';

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

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

  const comparison = assessment.type === 'CHALLENGE' ? await assessmentRepository.getChallengeComparison(id, session!.user.id).catch(() => null) : null;

  const totalDuration = assessment.durationSeconds ?? 0;
  const timeUsed = summary.attempt.timeSpentSeconds ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Exam Successfully Submitted</h1>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          Your responses have been recorded. Below is a high-level overview of your session.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Score" value={`${Number(summary.attempt.score ?? 0)}`} sub={`${Number(summary.attempt.percentage ?? 0).toFixed(1)}%`} />
        <StatCard label="Attempted" value={`${summary.attemptedCount}`} sub={`/ ${summary.totalQuestions}`} />
        <StatCard label="Skipped" value={`${summary.skippedCount}`} sub={`/ ${summary.totalQuestions}`} />
        <StatCard label="Reviewed" value={`${summary.reviewedCount}`} sub={`/ ${summary.totalQuestions}`} />
      </div>

      {comparison && comparison.challenger.attempt && comparison.opponent.attempt && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
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

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Time Allocation</p>
          <p className="text-xs text-muted-foreground">
            Total time: {formatDuration(timeUsed)} / {formatDuration(totalDuration)}
          </p>
          <div className="mt-4 space-y-3">
            {summary.sectionBreakdown.map((s) => (
              <div key={s.sectionId}>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.title}</span>
                  <span>{formatDuration(s.timeSpentSeconds)}</span>
                </div>
                <Progress value={totalDuration > 0 ? (s.timeSpentSeconds / totalDuration) * 100 : 0} className="mt-1 h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Section Breakdown</p>
          <p className="text-xs text-muted-foreground">Attempt rate per section</p>
          <div className="mt-4 space-y-3">
            {summary.sectionBreakdown.map((s) => (
              <div key={s.sectionId}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{s.title}</span>
                  <span className="text-muted-foreground">
                    {s.attempted}/{s.total}
                  </span>
                </div>
                <Progress value={s.total > 0 ? (s.attempted / s.total) * 100 : 0} className="mt-1 h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Review your answers</p>
        <Accordion type="single" collapsible className="mt-2">
          {attemptState.questions.map((q, i) => {
            const selected = q.selectedOptionKeys?.[0];
            return (
              <AccordionItem key={q.questionId} value={String(q.questionId)}>
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">{i + 1}</span>
                    <span className="text-left">
                      {!selected ? 'Not attempted' : q.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    <Badge className={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <BlogContent content={q.stem} />
                  <div className="mt-3 space-y-2">
                    {q.options.map((option) => {
                      const isCorrectOption = option.isCorrect;
                      const isSelectedOption = selected === option.key;
                      return (
                        <div
                          key={option.key}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm',
                            isCorrectOption && 'border-emerald-500/50 bg-emerald-500/10',
                            isSelectedOption && !isCorrectOption && 'border-destructive/50 bg-destructive/10',
                            !isCorrectOption && !isSelectedOption && 'border-border'
                          )}
                        >
                          <span className="font-mono text-xs text-muted-foreground">{option.key}</span>
                          <InlineMarkdown content={option.text} className="flex-1 text-foreground" />
                          {isCorrectOption && <Check className="h-4 w-4 text-emerald-600" />}
                          {isSelectedOption && !isCorrectOption && <X className="h-4 w-4 text-destructive" />}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                      <BlogContent content={q.explanation} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline">
          <Link href="/mocks">Back to My Mocks</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
