'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Lock, PlayCircle, ChevronRight } from 'lucide-react';
import type { TestClient, TestAttemptClient } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

interface TestWithAttempt extends TestClient {
  attempt: TestAttemptClient | null;
}

function getTestStatus(test: TestWithAttempt) {
  const now = new Date();
  const start = test.startAt ? new Date(test.startAt) : null;
  const end = test.endAt ? new Date(test.endAt) : null;

  if (test.attempt?.status === 'EVALUATED' || test.attempt?.status === 'SUBMITTED') {
    return 'completed';
  }
  if (end && now > end) return 'expired';
  if (start && now < start) return 'upcoming';
  return 'live';
}

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', icon: Clock, color: 'border-amber-400 text-amber-600' },
  live: { label: 'Live Now', icon: PlayCircle, color: 'border-success text-success' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'border-primary text-primary' },
  expired: { label: 'Expired', icon: Lock, color: 'border-muted-foreground text-muted-foreground' },
};

export function TestsListClient({ tests }: { tests: TestWithAttempt[] }) {
  const router = useRouter();

  if (tests.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No tests assigned yet"
        description="Check back later or contact your instructor."
      />
    );
  }

  const grouped = {
    live: tests.filter((t) => getTestStatus(t) === 'live'),
    upcoming: tests.filter((t) => getTestStatus(t) === 'upcoming'),
    completed: tests.filter((t) => getTestStatus(t) === 'completed'),
    expired: tests.filter((t) => getTestStatus(t) === 'expired'),
  };

  const renderGroup = (label: string, items: TestWithAttempt[], status: keyof typeof STATUS_CONFIG) => {
    if (items.length === 0) return null;
    const { icon: Icon, color } = STATUS_CONFIG[status];

    return (
      <div key={label} className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </h2>
        <div className="space-y-3">
          {items.map((test) => {
            const pct = test.attempt
              ? Math.round((test.attempt.marksObtained / test.attempt.totalMarks) * 100)
              : null;

            return (
              <div
                key={test.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                  color.replace('text-', 'border-').split(' ')[0],
                  'bg-muted/30'
                )}>
                  <Icon className={cn('h-5 w-5', color.split(' ')[1])} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{test.title}</span>
                    <Badge variant="outline" className={`text-xs ${color}`}>
                      {STATUS_CONFIG[status].label}
                    </Badge>
                    {pct !== null && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${pct >= (test.passMark / test.totalMarks * 100)
                          ? 'border-success text-success'
                          : 'border-destructive text-destructive'
                        }`}
                      >
                        {pct}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{test.mcqIds.length} questions</span>
                    <span>{test.duration} min</span>
                    {test.startAt && (
                      <span>Starts: {new Date(test.startAt).toLocaleString()}</span>
                    )}
                    {test.endAt && (
                      <span>Ends: {new Date(test.endAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <Button
                  variant={status === 'live' ? 'default' : 'ghost'}
                  size="sm"
                  disabled={status === 'expired' || status === 'upcoming'}
                  onClick={() => {
                    if (status === 'completed') {
                      router.push(`/tests/${test.id}/results`);
                    } else if (status === 'live') {
                      router.push(`/tests/${test.id}/take`);
                    }
                  }}
                >
                  {status === 'completed' ? 'Results' :
                   status === 'live' ? (test.attempt ? 'Continue' : 'Start') :
                   status === 'upcoming' ? 'Scheduled' : 'Expired'}
                  {(status === 'live' || status === 'completed') && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderGroup('Live Now', grouped.live, 'live')}
      {renderGroup('Upcoming', grouped.upcoming, 'upcoming')}
      {renderGroup('Completed', grouped.completed, 'completed')}
      {renderGroup('Expired', grouped.expired, 'expired')}
    </div>
  );
}
