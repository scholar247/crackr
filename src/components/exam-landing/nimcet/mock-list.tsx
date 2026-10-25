import Link from 'next/link';
import { ArrowRight, Clock, Info, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/exam-landing/shared/empty-state';
import type { NimcetMock } from '@/server/services/exam-landing/nimcet';
import { formatDuration, gated } from './utils';

const KIND_LABEL: Record<NimcetMock['kind'], string> = {
  open: 'SyllabuzAI open mock',
  practice: 'Practice test',
};

/** Says plainly that none of the tests listed are official NIMCET papers. */
export function MockProvenanceNote() {
  return (
    <p className="text-body-sm flex gap-2 text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      These are practice tests created on SyllabuzAI. None of them is an official NIMCET previous-year paper.
    </p>
  );
}

// Published NIMCET mocks, or an empty state that offers the mock builder instead.
export function MockList({ mocks, signedIn, buildMockHref, limit }: { mocks: NimcetMock[]; signedIn: boolean; buildMockHref: string; limit?: number }) {
  const shown = limit ? mocks.slice(0, limit) : mocks;
  const buildHref = gated(buildMockHref, signedIn);

  if (shown.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="h-5 w-5" />}
        title="No published NIMCET mocks yet"
        description="Build your own timed mock from the subjects and units you choose. You get a scored result and it counts towards your progress."
        action={
          <Button size="sm" className="rounded-full" asChild>
            <Link href={buildHref}>{signedIn ? 'Build a NIMCET mock' : 'Sign in to build a mock'}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((m) => (
        <li key={m.id}>
          <Link
            href={gated(`/mocks/${m.id}`, signedIn)}
            className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Badge variant={m.kind === 'open' ? 'default' : 'secondary'} className="self-start">
              {KIND_LABEL[m.kind]}
            </Badge>
            <span className="mt-3 block flex-1 font-semibold text-foreground">{m.title}</span>
            <span className="text-body-sm mt-3 flex items-center justify-between text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden /> {formatDuration(m.durationSeconds)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                {signedIn ? 'Start' : 'Sign in to start'} <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
