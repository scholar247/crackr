'use client';

import { cn } from '@/lib/utils';

type QuestionStatus = 'unanswered' | 'answered' | 'review';

interface QuestionNavigatorProps {
  count: number;
  currentIndex: number;
  statuses: QuestionStatus[];
  onNavigate: (index: number) => void;
  className?: string;
}

const STATUS_CLASSES: Record<QuestionStatus, string> = {
  unanswered: 'border-border bg-background text-muted-foreground hover:border-primary/50',
  answered: 'border-success bg-success/10 text-success hover:bg-success/20',
  review: 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100',
};

export function QuestionNavigator({
  count,
  currentIndex,
  statuses,
  onNavigate,
  className,
}: QuestionNavigatorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{statuses.filter(s => s === 'answered').length}/{count} answered</span>
        <span>{statuses.filter(s => s === 'review').length} flagged</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: count }).map((_, i) => {
          const status = statuses[i] ?? 'unanswered';
          const isCurrent = i === currentIndex;
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={cn(
                'h-9 w-full rounded-md border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                STATUS_CLASSES[status],
                isCurrent && 'ring-2 ring-primary ring-offset-1 font-bold'
              )}
              aria-label={`Question ${i + 1} — ${status}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-success bg-success/10" /> Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border" /> Not answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-amber-400 bg-amber-50" /> Flagged
        </span>
      </div>
    </div>
  );
}
