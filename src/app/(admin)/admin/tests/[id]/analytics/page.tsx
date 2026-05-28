import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TestAnalyticsClient } from './test-analytics-client';

export const metadata: Metadata = { title: 'Test Analytics' };

export default async function TestAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analytics = await serverGet<any>(`/api/admin/tests/${id}/analytics`).catch(() => null);
  if (!analytics) notFound();

  const enrichedLeaderboard = analytics.leaderboard ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {analytics.test?.title ?? 'Test Analytics'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {analytics.stats?.totalAttempts ?? 0} submissions
        </p>
      </div>
      <TestAnalyticsClient
        test={analytics.test!}
        stats={analytics.stats}
        leaderboard={enrichedLeaderboard}
        questionStats={analytics.questionStats ?? []}
      />
    </div>
  );
}
