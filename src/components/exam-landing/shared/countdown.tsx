'use client';

import { useEffect, useState } from 'react';

function partsUntil(target: number, now: number) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60) };
}

// Days / hours / minutes to `until`. Renders dashes until mounted so server and client markup match.
export function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const parts = now === null ? null : partsUntil(new Date(until).getTime(), now);
  const cells = [
    { label: 'Days', value: parts?.days },
    { label: 'Hours', value: parts?.hours },
    { label: 'Mins', value: parts?.minutes },
  ];

  return (
    <div className="flex gap-2" role="timer" aria-live="off">
      {cells.map((c) => (
        <div key={c.label} className="min-w-16 rounded-lg bg-background/10 px-3 py-2 text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums">{c.value === undefined ? '--' : String(c.value).padStart(2, '0')}</p>
          <p className="text-[10px] uppercase tracking-wide opacity-70">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
