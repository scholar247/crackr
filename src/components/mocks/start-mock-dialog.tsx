'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Rocket, TrendingUp, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Self-mock only — TEST/CHALLENGE attempts always count, so they skip this choice and
 * start immediately (see StartAttemptButton's `isSelfMock` prop). */
export function StartMockDialog({ assessmentId, isSelfMock }: { assessmentId: string; isSelfMock: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<'track' | 'practice'>('track');
  const [starting, setStarting] = useState(false);

  async function start(countsTowardProgress?: boolean) {
    setStarting(true);
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countsTowardProgress === undefined ? {} : { countsTowardProgress }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not start');
      router.push(`/mocks/${assessmentId}/room?attempt=${json.data.attempt.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setStarting(false);
    }
  }

  if (!isSelfMock) {
    return (
      <Button onClick={() => start()} disabled={starting}>
        <Rocket className="h-4 w-4" /> {starting ? 'Starting…' : 'Start'}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Rocket className="h-4 w-4" /> Start
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Before you start</DialogTitle>
            <DialogDescription>Should this attempt count toward your progress tracker, or is this just practice?</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setChoice('track')}
              className={cn('flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors', choice === 'track' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50')}
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Track progress</span>
              <span className="text-xs text-muted-foreground">Saved to your progress tracker.</span>
            </button>
            <button
              type="button"
              onClick={() => setChoice('practice')}
              className={cn('flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors', choice === 'practice' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50')}
            >
              <Dumbbell className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Just practice</span>
              <span className="text-xs text-muted-foreground">Scored normally, but not saved to your tracker.</span>
            </button>
          </div>

          <DialogFooter>
            <Button onClick={() => start(choice === 'track')} disabled={starting}>
              {starting ? 'Starting…' : 'Start mock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
