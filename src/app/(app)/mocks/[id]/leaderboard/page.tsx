import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Users, BarChart3, Star, Medal } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const MEDAL_CLASS: Record<number, string> = { 1: 'text-amber-400', 2: 'text-zinc-400', 3: 'text-amber-700' };

type RankingRow = Awaited<ReturnType<typeof assessmentRepository.getAssessmentReport>>['ranking'][number];

function formatDuration(totalSeconds: number) {
  const m = Math.round(totalSeconds / 60);
  return `${m}m`;
}

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const assessment = await assessmentRepository.findById(id);
  if (!assessment) notFound();

  // Visible to any participant with access, not just the organizer — a deliberate
  // difference from the participants roster, which stays organizer/admin-only.
  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) notFound();

  const isOrganizer = assessment.creatorUserId === session!.user.id || isAdmin(session!.user.role);
  const report = await assessmentRepository.getAssessmentReport(id);
  const viewerEntry = report.ranking.find((r) => r.userId === session!.user.id);

  // Top 3 always shown; if the viewer isn't already visible there, splice in a small
  // window around their own row (with an ellipsis marking the gap) so "where do I stand"
  // never requires scrolling a 100+ row table — same shape as the reference design.
  const TOP_N = 3;
  const top = report.ranking.slice(0, TOP_N);
  let middle: typeof report.ranking = [];
  let showEllipsis = false;
  if (viewerEntry && viewerEntry.rank > TOP_N + 1) {
    const start = Math.max(TOP_N, viewerEntry.rank - 2);
    const end = Math.min(report.ranking.length, viewerEntry.rank + 1);
    middle = report.ranking.slice(start, end);
    showEllipsis = start > TOP_N;
  } else if (report.ranking.length > TOP_N) {
    const end = viewerEntry ? Math.min(report.ranking.length, viewerEntry.rank + 1) : TOP_N;
    middle = report.ranking.slice(TOP_N, end);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/mocks/${id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to assessment
      </Link>

      <div className="mt-3">
        <h1 className="font-headline-lg text-headline-lg text-foreground">Assessment Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">{assessment.title}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-8 rounded-xl border border-border bg-muted/30 px-5 py-4">
        <StatItem icon={Users} label="Total Participants" value={String(report.participantCount)} />
        <StatItem icon={BarChart3} label="Avg Score" value={String(report.averageScore)} />
        {viewerEntry && <StatItem icon={Star} label="Your Rank" value={`#${viewerEntry.rank}`} accent />}
      </div>

      <div className="mt-4 flex gap-6 border-b border-border">
        <span className="border-b-2 border-primary px-1 pb-3 text-sm font-medium text-foreground">Overall Leaderboard</span>
        {viewerEntry && (
          <Link href={`/mocks/${id}/results/${viewerEntry.attemptId}`} className="border-b-2 border-transparent px-1 pb-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            My Performance
          </Link>
        )}
        {isOrganizer && (
          <Link href={`/mocks/${id}/analytics`} className="border-b-2 border-transparent px-1 pb-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            Question Analysis
          </Link>
        )}
      </div>

      {report.ranking.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No one has finished yet — check back once participants submit.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Accuracy</th>
                <th className="px-4 py-3 text-right">Correct</th>
                <th className="px-4 py-3 text-right">Wrong</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top.map((r) => (
                <LeaderboardRow key={r.userId} r={r} isMe={r.userId === session!.user.id} />
              ))}
              {showEllipsis && (
                <tr>
                  <td colSpan={7} className="py-2 text-center text-muted-foreground">
                    ⋮
                  </td>
                </tr>
              )}
              {middle.map((r) => (
                <LeaderboardRow key={r.userId} r={r} isMe={r.userId === session!.user.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ r, isMe }: { r: RankingRow; isMe: boolean }) {
  return (
    <tr className={cn('relative transition-colors hover:bg-muted/30', isMe && 'bg-primary/5')}>
      {isMe && <td className="absolute inset-y-0 left-0 w-1 bg-primary p-0" />}
      <td className="px-4 py-3 text-center">
        {r.rank <= 3 ? (
          <Medal className={cn('mx-auto h-5 w-5', MEDAL_CLASS[r.rank])} fill="currentColor" />
        ) : (
          <span className={cn('font-headline-md text-headline-md', isMe ? 'text-primary' : 'text-muted-foreground')}>{r.rank}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {(r.name ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className={cn('truncate', isMe ? 'font-label-md text-label-md text-primary' : 'text-foreground')}>
            {r.name ?? 'Participant'} {isMe && '(You)'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-headline-md text-headline-md text-foreground">{r.score}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{r.accuracy}%</td>
      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{r.correct}</td>
      <td className="px-4 py-3 text-right text-destructive">{r.wrong}</td>
      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{formatDuration(r.timeSpentSeconds)}</td>
    </tr>
  );
}

function StatItem({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={cn('h-5 w-5', accent ? 'text-primary' : 'text-muted-foreground')} />
      <div className="flex flex-col">
        <span className={cn('text-label-caps uppercase', accent ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
        <span className={cn('font-headline-md text-headline-md', accent ? 'text-primary' : 'text-foreground')}>{value}</span>
      </div>
    </div>
  );
}
