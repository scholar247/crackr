'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TimerProps {
  durationSeconds: number;
  startedAt: string;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ durationSeconds, startedAt, onExpire, className }: TimerProps) {
  const computeRemaining = useCallback(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  }, [durationSeconds, startedAt]);

  const [remaining, setRemaining] = useState(computeRemaining);

  useEffect(() => {
    setRemaining(computeRemaining());
    const interval = setInterval(() => {
      const r = computeRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [computeRemaining, onExpire]);

  const pct = durationSeconds > 0 ? (remaining / durationSeconds) * 100 : 0;
  const isWarning = remaining <= 300; // 5 minutes
  const isCritical = remaining <= 60;  // 1 minute

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-mono font-semibold transition-colors',
        isCritical
          ? 'border-destructive text-destructive bg-destructive/10 animate-pulse'
          : isWarning
          ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
          : 'border-border text-foreground',
        className
      )}
    >
      <Clock className="h-4 w-4 shrink-0" />
      {formatTime(remaining)}
    </div>
  );
}
