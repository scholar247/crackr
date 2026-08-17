import Link from 'next/link';
import { Plus, Clock, Users, Swords } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const TYPE_META: Record<string, { label: string; icon: typeof Clock }> = {
  MOCK: { label: 'Self Mock', icon: Clock },
  TEST: { label: 'Group Test', icon: Users },
  CHALLENGE: { label: 'Challenge', icon: Swords },
};

export default async function MocksHubPage() {
  const session = await auth();
  const [assessments, incomingChallenges] = await Promise.all([
    assessmentRepository.findVisibleToUser(session!.user.id, session!.user.role),
    assessmentRepository.listIncomingChallenges(session!.user.id),
  ]);

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
        <AssessmentList items={mine} emptyLabel="You haven't created a mock, test, or challenge yet." />
      </section>

      {assigned.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Assigned to me</h2>
          <AssessmentList items={assigned} emptyLabel="Nothing assigned to you yet." />
        </section>
      )}
    </div>
  );
}

function AssessmentList({ items, emptyLabel }: { items: Awaited<ReturnType<typeof assessmentRepository.findVisibleToUser>>; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => {
        const meta = TYPE_META[a.type] ?? TYPE_META.MOCK;
        const Icon = meta.icon;
        return (
          <Link
            key={a.id}
            href={`/mocks/${a.id}`}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4 text-primary" />
              <Badge variant="secondary">{meta.label}</Badge>
            </div>
            <p className="mt-3 font-medium text-foreground">{a.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.durationSeconds ? `${Math.round(a.durationSeconds / 60)} min` : 'No duration set'} · {a.status}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
