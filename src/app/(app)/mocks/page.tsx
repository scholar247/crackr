import Link from 'next/link';
import { Plus, Clock, Users, Swords, Globe2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const TYPE_META: Record<string, { label: string; icon: typeof Clock }> = {
  MOCK: { label: 'Self Mock', icon: Clock },
  TEST: { label: 'Group Test', icon: Users },
  CHALLENGE: { label: 'Challenge', icon: Swords },
  OFFICIAL: { label: 'Open Mock', icon: Globe2 },
};

type ComputedStatus = 'DRAFT' | 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';

const STATUS_META: Record<ComputedStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  UPCOMING: { label: 'Upcoming', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  LIVE: { label: 'Live', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  COMPLETED: { label: 'Completed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  ARCHIVED: { label: 'Archived', className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500' },
};

function computeStatus(
  a: { status: string; startsAt: Date | null; endsAt: Date | null },
  myAttempt: { status: string } | undefined,
): ComputedStatus {
  if (a.status === 'ARCHIVED') return 'ARCHIVED';
  if (a.status === 'DRAFT') return 'DRAFT';
  if (myAttempt && (myAttempt.status === 'SUBMITTED' || myAttempt.status === 'EXPIRED')) return 'COMPLETED';
  const now = new Date();
  if (a.startsAt && now < a.startsAt) return 'UPCOMING';
  if (a.endsAt && now > a.endsAt) return 'COMPLETED';
  return 'LIVE';
}

export default async function MocksHubPage() {
  const session = await auth();
  const [assessments, incomingChallenges, myAttempts] = await Promise.all([
    assessmentRepository.findVisibleToUser(session!.user.id, session!.user.role),
    assessmentRepository.listIncomingChallenges(session!.user.id),
    assessmentRepository.listMyAttempts(session!.user.id),
  ]);

  // listMyAttempts is ordered newest-first, so the first occurrence per assessment is
  // this viewer's latest attempt — no N+1 queries needed to know "have I finished this."
  const latestAttemptByAssessment = new Map<string, (typeof myAttempts)[number]['attempt']>();
  for (const row of myAttempts) {
    if (!latestAttemptByAssessment.has(row.assessment.id)) latestAttemptByAssessment.set(row.assessment.id, row.attempt);
  }

  const testAssessmentIds = assessments.filter((a) => a.type === 'TEST').map((a) => a.id);
  const participantCounts = new Map<string, number>();
  await Promise.all(
    testAssessmentIds.map(async (id) => {
      const { participants } = await assessmentRepository.listParticipants(id);
      participantCounts.set(id, participants.length);
    }),
  );

  const mine = assessments.filter((a) => a.creatorUserId === session!.user.id);
  const assigned = assessments.filter((a) => a.creatorUserId !== session!.user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mock Tests & Challenges</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Build a self-paced mock, run a group test, or challenge someone to a head-to-head.</p>
        </div>
        <Button asChild>
          <Link href="/mocks/new">
            <Plus className="h-4 w-4" /> Create
          </Link>
        </Button>
      </div>

      {incomingChallenges.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Challenges waiting on you</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {incomingChallenges.map((row) => (
              <Link
                key={row.assessment.id}
                href={`/mocks/${row.assessment.id}`}
                className="rounded-xl border border-primary/40 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
              >
                <div className="flex items-center justify-between">
                  <Swords className="h-4 w-4 text-primary" />
                  <Badge variant="secondary">Challenge</Badge>
                </div>
                <p className="mt-3 font-medium text-foreground">{row.assessment.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.challengerName ?? row.challengerEmail} challenged you</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">My mocks</h2>
        <AssessmentList items={mine} emptyLabel="You haven't created a mock, test, or challenge yet." latestAttemptByAssessment={latestAttemptByAssessment} participantCounts={participantCounts} />
      </section>

      {assigned.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Assigned to me</h2>
          <AssessmentList items={assigned} emptyLabel="Nothing assigned to you yet." latestAttemptByAssessment={latestAttemptByAssessment} participantCounts={participantCounts} />
        </section>
      )}
    </div>
  );
}

function AssessmentList({
  items,
  emptyLabel,
  latestAttemptByAssessment,
  participantCounts,
}: {
  items: Awaited<ReturnType<typeof assessmentRepository.findVisibleToUser>>;
  emptyLabel: string;
  latestAttemptByAssessment: Map<string, { status: string; score: string | null } | undefined>;
  participantCounts: Map<string, number>;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => {
        const meta = TYPE_META[a.type] ?? TYPE_META.MOCK;
        const Icon = meta.icon;
        const myAttempt = latestAttemptByAssessment.get(a.id);
        const status = computeStatus(a, myAttempt);
        const statusMeta = STATUS_META[status];
        const participantCount = a.type === 'TEST' ? participantCounts.get(a.id) : undefined;
        return (
          <Link
            key={a.id}
            href={`/mocks/${a.id}`}
            className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            {a.bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL
              <img src={a.bannerImage} alt="" className="h-24 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-primary" />
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary">{meta.label}</Badge>
                  <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                </div>
              </div>
              <p className="mt-3 font-medium text-foreground">{a.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.durationSeconds ? `${Math.round(a.durationSeconds / 60)} min` : 'No duration set'}
                {participantCount !== undefined && ` · ${participantCount} participant${participantCount === 1 ? '' : 's'}`}
                {status === 'COMPLETED' && myAttempt?.score != null && ` · Your score: ${myAttempt.score}`}
              </p>
              {a.tags && a.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
