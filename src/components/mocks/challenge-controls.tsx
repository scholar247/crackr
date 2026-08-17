'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChallengeInfo {
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  isChallenger: boolean;
  opponentName: string | null;
  challengerName: string | null;
  startsAt: string | null;
}

export function ChallengeControls({ assessmentId, challenge }: { assessmentId: string; challenge: ChallengeInfo }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function respond(accept: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}/challenge/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not respond');
      toast.success(accept ? 'Challenge accepted' : 'Challenge declined');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function startNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}/challenge/start`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not start');
      toast.success('Challenge started — deadline locked in for both of you');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (challenge.status === 'PENDING' && !challenge.isChallenger) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-foreground">{challenge.challengerName ?? 'Someone'} challenged you to this test.</p>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => respond(true)} disabled={busy}>
            <Check className="h-4 w-4" /> Accept
          </Button>
          <Button variant="outline" onClick={() => respond(false)} disabled={busy}>
            <X className="h-4 w-4" /> Decline
          </Button>
        </div>
      </div>
    );
  }

  if (challenge.status === 'PENDING' && challenge.isChallenger) {
    return <p className="text-sm text-muted-foreground">Waiting for {challenge.opponentName ?? 'your opponent'} to respond…</p>;
  }

  if (challenge.status === 'DECLINED') {
    return <p className="text-sm text-muted-foreground">{challenge.opponentName ?? 'Your opponent'} declined this challenge.</p>;
  }

  if (challenge.status === 'ACCEPTED' && !challenge.startsAt) {
    return (
      <Button onClick={startNow} disabled={busy}>
        <Rocket className="h-4 w-4" /> Start Now
      </Button>
    );
  }

  return null;
}
