import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { Progress } from '@/components/ui/progress';
import { AttemptReview } from '@/components/mocks/attempt-review';

export const dynamic = 'force-dynamic';

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

export default async function ParticipantDetailPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth();
  const { id, userId } = await params;

  const assessment = await assessmentRepository.findById(id);
  if (!assessment) notFound();
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) notFound();

  const attempt = await assessmentRepository.findLatestCompletedAttempt(id, userId);
  if (!attempt) notFound();

  // Passing the STUDENT's own userId (not the viewer's) satisfies these functions'
  // internal ownership check — the organizer/admin authorization already happened above.
  const [state, summary, report] = await Promise.all([
    assessmentRepository.getAttemptState(id, attempt.id, userId),
    assessmentRepository.getResultsSummary(id, attempt.id, userId),
    assessmentRepository.getAssessmentReport(id),
  ]);
  const ranked = report.ranking.find((r) => r.userId === userId);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/mocks/${id}/participants`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to participants
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{ranked?.name ?? 'Participant'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ranked?.email}</p>
        </div>
        {ranked && <p className="text-3xl font-bold text-foreground">#{ranked.rank}</p>}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Score" value={`${Number(summary.attempt.score ?? 0)}`} sub={`${Number(summary.attempt.percentage ?? 0).toFixed(1)}%`} />
        <StatCard label="Accuracy" value={`${ranked?.accuracy ?? 0}%`} sub={`${ranked?.correct ?? 0} correct`} />
        <StatCard label="Attempted" value={`${summary.attemptedCount}`} sub={`/ ${summary.totalQuestions}`} />
        <StatCard label="Time Taken" value={formatDuration(summary.attempt.timeSpentSeconds ?? 0)} sub={summary.attempt.status} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Topic performance</p>
        <div className="mt-4 space-y-3">
          {summary.sectionBreakdown.map((s) => (
            <div key={s.sectionId}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{s.title}</span>
                <span className="text-muted-foreground">
                  {s.correct}/{s.total} correct · {s.marks}/{s.maxMarks} marks
                </span>
              </div>
              <Progress value={s.total > 0 ? (s.correct / s.total) * 100 : 0} className="mt-1 h-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Question-by-question</p>
        <div className="mt-3">
          <AttemptReview questions={state.questions} />
        </div>
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
