'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import { ProgressLineChart } from './progress-line-chart';
import { ProgressStatCard } from './progress-stat-card';
import { ProgressEmptyState } from './progress-empty-state';
import { progressColorFor } from './progress-chart-colors';

type ProgressType = 'exam' | 'subject' | 'chapter';

const COPY: Record<ProgressType, { title: string; description: string; emptyMessage: string }> = {
  exam: {
    title: 'Score Trend by Exam',
    description: 'Each point is one mock, in the order you took it.',
    emptyMessage: 'Take a mock to see your exam-wise progress build up here.',
  },
  subject: {
    title: 'Score Trend by Subject',
    description: 'One line per subject, scored from your actual answers — not your overall mock score.',
    emptyMessage: 'Take a mock covering multiple subjects to see a subject-wise breakdown.',
  },
  chapter: {
    title: 'Score Trend by Chapter',
    description: 'Chapter-level breakdown, once a mock is tagged down to chapter level.',
    emptyMessage: 'No chapter-tagged mocks yet — this fills in automatically once one is.',
  },
};

async function fetchProgress(type: ProgressType): Promise<ProgressGroup[]> {
  const res = await fetch(`/api/v1/progress?type=${type}`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  const json = await res.json();
  return json.data ?? [];
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProgressTab({ type }: { type: ProgressType }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['progress', type], queryFn: () => fetchProgress(type) });
  const copy = COPY[type];

  if (isLoading) return <ProgressSkeleton />;
  if (isError) return <ProgressEmptyState message="Couldn't load your progress right now — try refreshing." />;
  if (!data || data.length === 0) return <ProgressEmptyState message={copy.emptyMessage} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressLineChart groups={data} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((group, i) => (
          <ProgressStatCard
            key={group.id ?? group.name}
            group={group}
            accent={progressColorFor(i)}
            href={type === 'exam' ? `/exams/${group.meta}` : undefined}
          />
        ))}
      </div>
    </div>
  );
}
