import Link from 'next/link';
import { ArrowRight, Clock, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/exam-landing/shared/empty-state';
import type { LandingMock } from '@/server/services/exam-landing/cbse';

/** Mock routes live behind sign-in; send guests through sign-in and back to the same place. */
function gated(href: string, signedIn: boolean) {
  return signedIn ? href : `/sign-in?callbackUrl=${encodeURIComponent(href)}`;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Untimed';
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`;
}

// Open mocks and practice tests for the exam, or an empty state that offers a custom mock.
export function MockList({ mocks, signedIn, classLabel }: { mocks: LandingMock[]; signedIn: boolean; classLabel: string }) {
  if (mocks.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="h-5 w-5" />}
        title={`Build your own ${classLabel} mock`}
        description="Full-length board-style mocks are coming soon. Meanwhile, build a timed mock from the subjects and chapters you choose."
        action={
          <Button size="sm" className="rounded-full" asChild>
            <Link href={buildMockHref(signedIn)}>{signedIn ? 'Build a mock' : 'Sign in to build a mock'}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {mocks.map((m) => (
        <li key={m.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <Badge variant={m.kind === 'official' ? 'info' : 'neutral'}>{m.kind === 'official' ? 'Open mock' : 'Practice test'}</Badge>
            <h3 className="mt-3 font-semibold text-foreground">{m.title}</h3>
            <p className="text-body-sm mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(m.durationSeconds)}
            </p>
          </div>
          <Button size="sm" className="self-start rounded-full" asChild>
            <Link href={gated(`/mocks/${m.id}`, signedIn)}>
              {signedIn ? 'Start mock' : 'Sign in to start'} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Self-built mock wizard (behind sign-in). */
export function buildMockHref(signedIn: boolean) {
  return gated('/mocks/new/self', signedIn);
}
