import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { PATTERN } from '@/content/exams/nimcet/official';
import type { NimcetData } from '@/server/services/exam-landing/nimcet';
import { MockList, MockProvenanceNote } from '../mock-list';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';
import { gated } from '../utils';

export function NimcetMockTestsPage({ data }: { data: NimcetData }) {
  const { mocks, signedIn, links } = data;
  const buildHref = gated(links.buildMock, signedIn);
  const sections = PATTERN.parts.flatMap((p) => p.sections.map((s) => ({ ...s, minutes: p.minutes, part: p.part, shared: p.sections.length > 1 })));

  return (
    <NimcetPageShell
      nav="mock-tests"
      crumbs={[{ label: 'Mock tests' }]}
      eyebrow="Mock tests"
      title="NIMCET mock tests"
      intro="Timed tests that give you a scored result, an answer-by-answer review, and a score trend over time."
      aside={
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" asChild>
            <Link href={buildHref}>{signedIn ? 'Build a mock' : 'Sign in to build a mock'}</Link>
          </Button>
          {signedIn && (
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/mocks">Your mocks</Link>
            </Button>
          )}
        </div>
      }
      nextSteps={[STEP.practice, STEP.pattern, { label: 'Your progress', description: 'Scores and trends from every mock', href: gated('/progress', signedIn) }]}
    >
      <PageSection id="available" title="Available NIMCET mocks">
        <MockList mocks={mocks} signedIn={signedIn} buildMockHref={links.buildMock} />
        <div className="mt-4">
          <MockProvenanceNote />
        </div>
      </PageSection>

      <PageSection
        id="blueprint"
        title="Build a mock that matches the real paper"
        description="Use these settings in the mock builder: one section per subject, with the official question counts and marking. Set the time to 120 minutes."
        action={<RecommendationTag />}
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Recommended mock sections based on the official NIMCET {PATTERN.year} pattern</caption>
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Section</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Questions</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Marks each</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Negative</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Official time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sections.map((s) => (
                <tr key={s.name}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {s.name}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">{s.questions}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.correct}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.wrong}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {s.minutes} min{s.shared && ' (shared)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-body-sm mt-3 text-muted-foreground">
          The real test locks each part to its own time. A mock built here uses one overall timer, so watch the clock yourself at 70 and 100 minutes.
          If a subject doesn’t have enough questions yet, use a smaller section and scale the time down to match.
        </p>
        <Button className="mt-4 rounded-full" asChild>
          <Link href={buildHref}>{signedIn ? 'Open the mock builder' : 'Sign in to open the mock builder'}</Link>
        </Button>
      </PageSection>

      <PageSection id="after" title="After you submit">
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Scored result', detail: 'Your marks with negative marking applied, and every answer marked right or wrong.' },
            { title: 'Analysis', detail: 'Go through each question with its solution to see where marks were lost.' },
            { title: 'Progress over time', detail: 'Each submitted mock adds to your trend, overall and per subject.' },
          ].map((f) => (
            <li key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-body-sm mt-1 text-muted-foreground">{f.detail}</p>
            </li>
          ))}
        </ul>
      </PageSection>
    </NimcetPageShell>
  );
}
