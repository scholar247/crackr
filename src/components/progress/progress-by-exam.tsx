'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface ExamProgress {
  examId: string | null;
  examName: string;
  examSlug: string;
  totalAttempts: number;
  avgPercentage: number;
}

export function ProgressByExam({ userId }: { userId: string }) {
  const [data, setData] = useState<ExamProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/v1/progress?type=exam');
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
              <Skeleton className="h-4 w-32" />
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
          <CardDescription>Take some mock tests to see your progress</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((exam) => (
        <Card key={exam.examId || 'unknown'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{exam.examName}</CardTitle>
            <CardDescription>{exam.totalAttempts} attempt{exam.totalAttempts !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Score</span>
              <span className="font-medium">{exam.avgPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={exam.avgPercentage} className="h-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
