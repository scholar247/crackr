'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface SubjectProgress {
  nodeId: string | null;
  nodeName: string;
  nodeType: string;
  totalAttempts: number;
  avgPercentage: number;
}

export function ProgressBySubject({ userId }: { userId: string }) {
  const [data, setData] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/v1/progress?type=subject');
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
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Progress Data</CardTitle>
          <CardDescription>Take some mock tests to see your subject-wise progress</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sort by percentage descending
  const sorted = [...data].sort((a, b) => b.avgPercentage - a.avgPercentage);

  return (
    <div className="space-y-3">
      {sorted.map((subject) => (
        <Card key={subject.nodeId || 'unknown'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{subject.nodeName}</CardTitle>
                <CardDescription>{subject.totalAttempts} attempt{subject.totalAttempts !== 1 ? 's' : ''}</CardDescription>
              </div>
              <Badge variant={subject.avgPercentage >= 70 ? 'default' : subject.avgPercentage >= 50 ? 'secondary' : 'destructive'}>
                {subject.avgPercentage.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={subject.avgPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {subject.avgPercentage >= 70 ? '✨ Great performance!' : subject.avgPercentage >= 50 ? '📈 Keep practicing' : '⚠️ Needs more practice'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
