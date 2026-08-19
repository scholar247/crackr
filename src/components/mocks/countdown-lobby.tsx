'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hourglass, Users } from 'lucide-react';

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Pre-start waiting room for a synchronized-start assessment (a CHALLENGE, or a
 * FIXED-scheduling group TEST) — only rendered while `startsAt` is still in the future.
 * The countdown is cosmetic, same as the in-exam timer: it's re-derived from the server
 * `startsAt` timestamp on every mount, and once it reaches zero this just asks the server
 * component to re-render (router.refresh()), which then shows the real Start button —
 * the server, not this countdown, is what actually decides "has it started yet" (see
 * MockLobbyPage's windowNotYetOpen, computed fresh on every request).
 */
export function CountdownLobby({ startsAt, participantSummary }: { startsAt: string; participantSummary: string }) {
  const router = useRouter();
  const target = new Date(startsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const tick = () => {
      const next = target - Date.now();
      setRemaining(next);
      if (next <= 0) router.refresh();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target, router]);

  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <Hourglass className="h-6 w-6 text-primary" />
      <div>
        <p className="text-3xl font-bold tabular-nums text-foreground">{remaining > 0 ? formatCountdown(remaining) : 'Starting…'}</p>
        <p className="mt-1 text-sm text-muted-foreground">until the test starts — stay on this page</p>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="h-4 w-4" /> {participantSummary}
      </div>
    </div>
  );
}
