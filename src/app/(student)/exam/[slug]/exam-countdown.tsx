'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  targetDate: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calc(target: Date): Remaining {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Seg({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl md:text-4xl font-bold tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function ExamCountdown({ targetDate }: Props) {
  const target = new Date(targetDate);
  const [rem, setRem] = useState<Remaining>(calc(target));

  useEffect(() => {
    const id = setInterval(() => setRem(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const isPast = rem.days === 0 && rem.hours === 0 && rem.minutes === 0 && rem.seconds === 0;

  if (isPast) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="h-4 w-4" />
        <span>Exam date has passed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Seg value={rem.days} label="days" />
      <span className="text-2xl font-bold text-muted-foreground mb-4">:</span>
      <Seg value={rem.hours} label="hrs" />
      <span className="text-2xl font-bold text-muted-foreground mb-4">:</span>
      <Seg value={rem.minutes} label="min" />
      <span className="text-2xl font-bold text-muted-foreground mb-4">:</span>
      <Seg value={rem.seconds} label="sec" />
    </div>
  );
}
