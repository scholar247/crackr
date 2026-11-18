import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { CbsePageShell } from '../page-shell';
import { MockList, buildMockHref } from '../mock-tests';

const TIPS = [
  { title: 'Sit it like the real paper', body: 'Three hours, no notes, phone away. Reading time counts — use it to plan which sections to attempt first.' },
  { title: 'Review every mistake', body: 'Sort errors into concept gaps, careless slips and time pressure. Each needs a different fix.' },
  { title: 'Space them out', body: 'One full mock a week in the pre-board months beats several in a row. Revise the weak chapters in between.' },
];

export function CbseMockTestsPage({ data }: { data: CbseLandingData }) {
  const { board, mocks, signedIn, links } = data;
  const c = board.shortLabel;

  return (
    <CbsePageShell
      board={board}
      current="mock-tests"
      eyebrow={`CBSE · ${c} · Mock tests`}
      title={`${board.label} Mock Tests`}
      intro={
        <>
          Timed, board-style tests for {c}. A mock shows where marks slip away — speed, accuracy, or chapters you haven&apos;t revised — and your scores are saved
          so you can track progress.
        </>
      }
    >
      <PageSection
        id="mocks"
        title={`${c} mock tests to attempt`}
        action={
          mocks.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href={buildMockHref(signedIn)}>
                <Wrench className="h-4 w-4" /> Build your own mock
              </Link>
            </Button>
          )
        }
      >
        <MockList mocks={mocks} signedIn={signedIn} classLabel={c} />
      </PageSection>

      <PageSection id="how-to" title="How to get the most from a mock test">
        <ol className="grid gap-4 md:grid-cols-3">
          {TIPS.map((t, i) => (
            <li key={t.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 font-mono text-xs font-semibold text-secondary">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-foreground">{t.title}</h3>
              <p className="text-body-sm mt-1 text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ol>
        <p className="text-body-sm mt-4 text-muted-foreground">
          Want the official format? Solve the{' '}
          <Link href={links.samplePapers} className="font-medium text-primary hover:underline">
            {board.label} sample papers
          </Link>{' '}
          as full mocks and mark them with the official marking scheme.
        </p>
      </PageSection>
    </CbsePageShell>
  );
}
