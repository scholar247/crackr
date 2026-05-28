'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface ScoreCardProps {
  marksObtained: number;
  totalMarks: number;
  timeTakenSeconds: number;
  passMark?: number;
  rank?: number;
  percentile?: number;
  className?: string;
}

function AnimatedNumber({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [target, duration]);

  return <>{current}</>;
}

export function ScoreCard({
  marksObtained,
  totalMarks,
  timeTakenSeconds,
  passMark,
  rank,
  percentile,
  className,
}: ScoreCardProps) {
  const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
  const passed = passMark !== undefined ? marksObtained >= passMark : undefined;

  return (
    <div className={cn('animate-count-up', className)}>
      {/* Score circle */}
      <div className="flex flex-col items-center gap-2 py-8">
        <div className={cn(
          'relative flex h-36 w-36 items-center justify-center rounded-full border-8',
          passed === true ? 'border-success' :
          passed === false ? 'border-destructive' :
          'border-primary'
        )}>
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">
              <AnimatedNumber target={Math.round(percentage)} />
              <span className="text-2xl">%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {marksObtained}/{totalMarks} marks
            </div>
          </div>
        </div>

        {passed !== undefined && (
          <div className={cn(
            'rounded-full px-4 py-1.5 text-sm font-semibold',
            passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            {passed ? '✓ Passed' : '✗ Not Passed'}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          icon={Target}
          label="Score"
          value={`${marksObtained}/${totalMarks}`}
        />
        <StatBox
          icon={TrendingUp}
          label="Percentage"
          value={`${percentage.toFixed(1)}%`}
        />
        <StatBox
          icon={Clock}
          label="Time"
          value={formatTime(timeTakenSeconds)}
        />
        {rank !== undefined && (
          <StatBox
            icon={Award}
            label="Rank"
            value={`#${rank}`}
          />
        )}
        {percentile !== undefined && (
          <StatBox
            icon={TrendingUp}
            label="Percentile"
            value={`${percentile.toFixed(1)}th`}
          />
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-center">
      <Icon className="h-5 w-5 text-muted-foreground mx-auto" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
