'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import { clampPercentage } from './progress-chart-colors';

interface ProgressStatCardProps {
  group: ProgressGroup;
  accent: string;
  /** Only the exam tab can deep-link a card to a real page (/exams/{slug}). */
  href?: string;
}

export function ProgressStatCard({ group, accent, href }: ProgressStatCardProps) {
  const latest = clampPercentage(group.latestPercentage);
  const avg = clampPercentage(group.avgPercentage);
  const isPersonalBest = group.series.length > 1 && group.latestPercentage >= group.bestPercentage;
  const scoreVariant = latest >= 70 ? 'success' : latest >= 40 ? 'warning' : 'danger';

  const title = href ? (
    <Link href={href} className="hover:underline">
      {group.name}
    </Link>
  ) : (
    group.name
  );

  return (
    <Card className="group animate-count-up relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>
              {group.totalAttempts} mock{group.totalAttempts !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge variant={scoreVariant} className={cn(isPersonalBest && 'animate-streak-glow')}>
            {Math.round(latest)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${latest}%`, backgroundColor: accent }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Avg {Math.round(avg)}%</span>
          {isPersonalBest ? (
            <span className="inline-flex items-center gap-1 font-medium text-warning">
              <Trophy className="h-3 w-3" /> Personal Best
            </span>
          ) : group.trend === 'up' ? (
            <span className="inline-flex items-center gap-1 text-success">
              <TrendingUp className="h-3.5 w-3.5" /> Improving
            </span>
          ) : group.trend === 'down' ? (
            <span className="inline-flex items-center gap-1 text-destructive">
              <TrendingDown className="h-3.5 w-3.5" /> Dipped
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Minus className="h-3.5 w-3.5" /> Steady
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
