'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChapterProgress {
  nodeId: string | null;
  totalAttempts: number;
  avgPercentage: number;
}

export function ProgressByChapter({ userId }: { userId: string }) {
  const [data, setData] = useState<ChapterProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/v1/progress?type=chapter');
        if (!response.ok) throw new Error('Failed to fetch progress');
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Progress Data</CardTitle>
          <CardDescription>Take some mock tests to see your chapter-wise progress</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data.map((item, idx) => ({
    chapter: `Chapter ${idx + 1}`,
    percentage: Math.round(item.avgPercentage),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chapter-wise Performance</CardTitle>
          <CardDescription>{data.length} chapters tracked</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="chapter" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {data.map((chapter, idx) => (
          <Card key={chapter.nodeId || idx}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Chapter {idx + 1}</CardTitle>
                  <CardDescription>{chapter.totalAttempts} attempt{chapter.totalAttempts !== 1 ? 's' : ''}</CardDescription>
                </div>
                <Badge variant={chapter.avgPercentage >= 70 ? 'default' : chapter.avgPercentage >= 50 ? 'secondary' : 'destructive'}>
                  {chapter.avgPercentage.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={chapter.avgPercentage} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
