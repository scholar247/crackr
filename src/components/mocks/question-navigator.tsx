'use client';

import { cn } from '@/lib/utils';

export interface NavigatorQuestion {
  questionId: number;
  answered: boolean;
  markedForReview: boolean;
}

/** Question-number grid for the exam room sidebar — Attempted/Review/Unseen/Current chip states. */
export function QuestionNavigator({
  questions,
  currentIndex,
  onSelect,
}: {
  questions: NavigatorQuestion[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Question navigator" className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Navigator</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <Legend swatchClassName="bg-primary" label="Attempted" />
        <Legend swatchClassName="bg-amber-500" label="Review" />
        <Legend swatchClassName="bg-muted border border-border" label="Unseen" />
        <Legend swatchClassName="border-2 border-primary" label="Current" />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {questions.map((q, index) => {
          const isCurrent = index === currentIndex;
          return (
            <button
              key={q.questionId}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                isCurrent && 'border-2 border-primary text-primary bg-primary/10',
                !isCurrent && q.markedForReview && 'bg-amber-500 text-white',
                !isCurrent && !q.markedForReview && q.answered && 'bg-primary text-primary-foreground',
                !isCurrent && !q.markedForReview && !q.answered && 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Legend({ swatchClassName, label }: { swatchClassName: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', swatchClassName)} />
      {label}
    </span>
  );
}
