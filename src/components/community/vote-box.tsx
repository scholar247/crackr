'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VoteBox({
  score,
  myVote,
  onVote,
  disabled,
  size = 'md',
}: {
  score: number;
  myVote: 1 | -1 | null;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className={cn('rounded p-0.5 transition-colors', myVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
      >
        <ChevronUp className={iconSize} />
      </button>
      <span className={cn('font-label-md text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>{score}</span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className={cn('rounded p-0.5 transition-colors', myVote === -1 ? 'text-destructive' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  );
}
