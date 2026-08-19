import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, BarChart3, Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ATTEMPT_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SUBMITTED: STATUS_COLORS.PUBLISHED,
  EXPIRED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
  ABANDONED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
};

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const assessment = await assessmentRepository.findById(id);
  if (!assessment) notFound();
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) notFound();

  const [{ participants, pendingInvites }, report] = await Promise.all([
    assessmentRepository.listParticipants(id),
    assessmentRepository.getAssessmentReport(id),
  ]);

  const rankedByUserId = new Map(report.ranking.map((r) => [r.userId, r]));
  // Anyone not in the ranked (completed) set — no attempt yet, or still IN_PROGRESS.
  const notCompleted = participants.filter((p) => !rankedByUserId.has(p.userId));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Participants</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{assessment.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/mocks/${id}/leaderboard`}>
              <Trophy className="h-4 w-4" /> Leaderboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/mocks/${id}/analytics`}>
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/v1/assessments/${id}/export`} download>
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatTile label="Participants" value={String(report.participantCount)} />
        <StatTile label="Completed" value={String(report.completedCount)} />
        <StatTile label="Avg Score" value={String(report.averageScore)} />
        <StatTile label="Median Score" value={String(report.medianScore)} />
        <StatTile label="Highest" value={String(report.highestScore)} />
        <StatTile label="Avg Accuracy" value={`${report.averageAccuracy}%`} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Rank</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">Accuracy</th>
              <th className="px-4 py-2.5">Attempted</th>
              <th className="px-4 py-2.5">Correct</th>
              <th className="px-4 py-2.5">Wrong</th>
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {report.ranking.map((r) => (
              <tr key={r.userId} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium text-foreground">#{r.rank}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/mocks/${id}/participants/${r.userId}`} className="text-foreground hover:text-primary hover:underline">
                    {r.name ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.email}</td>
                <td className="px-4 py-2.5 text-foreground">{r.score}</td>
                <td className="px-4 py-2.5 text-foreground">{r.accuracy}%</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {r.attempted}/{r.attempted + r.unattempted}
                </td>
                <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">{r.correct}</td>
                <td className="px-4 py-2.5 text-destructive">{r.wrong}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDuration(r.timeSpentSeconds)}</td>
                <td className="px-4 py-2.5">
                  <Badge className={ATTEMPT_STATUS_COLORS[r.status]}>{r.status.replace('_', ' ')}</Badge>
                </td>
              </tr>
            ))}
            {notCompleted.map((p) => (
              <tr key={p.userId} className="opacity-70">
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-foreground">{p.name ?? '—'}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5">
                  {p.attempt ? (
                    <Badge className={ATTEMPT_STATUS_COLORS[p.attempt.status]}>{p.attempt.status.replace('_', ' ')}</Badge>
                  ) : (
                    <Badge variant="secondary">Not started</Badge>
                  )}
                </td>
              </tr>
            ))}
            {pendingInvites.map((invite) => (
              <tr key={invite.id} className="opacity-70">
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">{invite.email}</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">Pending signup</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {report.ranking.length === 0 && notCompleted.length === 0 && pendingInvites.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No participants invited yet.</p>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
