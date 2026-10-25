import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { COUNSELLING_2026, CYCLE_2026, NEXT_CYCLE, formatRupees } from '@/content/exams/nimcet/official';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';

// The result, counselling and allotment rows of the 2026 timeline.
const COUNSELLING_DATES = CYCLE_2026.dates.slice(5);

export function NimcetCounsellingPage() {
  return (
    <NimcetPageShell
      nav="colleges"
      crumbs={[{ label: 'Colleges', href: '/exams/nimcet/colleges' }, { label: 'Admission & counselling' }]}
      eyebrow="Official · NIMCET 2026"
      title="NIMCET admission and counselling process"
      intro="After results, admission to the participating NITs and IIITs is through online counselling based on your NIMCET rank and the institutes you choose."
      aside={<OfficialSourceNote source={COUNSELLING_2026.source} className="lg:max-w-xs" />}
      nextSteps={[STEP.colleges, STEP.eligibility, STEP.overview]}
    >
      <PageSection id="steps" title="How counselling works">
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {COUNSELLING_2026.steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 font-mono text-sm font-semibold text-secondary">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-foreground">{s.title}</h3>
              <p className="text-body-sm mt-1 text-muted-foreground">{s.detail}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection id="fees" title="Counselling fees (2026)">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <caption className="sr-only">NIMCET 2026 counselling fees</caption>
              <tbody className="divide-y divide-border">
                {COUNSELLING_2026.fees.map((f) => (
                  <tr key={f.label}>
                    <th scope="row" className="px-5 py-3 text-left font-medium text-foreground">
                      {f.label}
                    </th>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatRupees(f.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-body-sm mt-3 text-muted-foreground">
            Freezing a seat also requires a partial admission fee; the amount is set in the official e-counselling guidelines for the year.
          </p>
        </PageSection>

        <PageSection id="schedule" title="2026 schedule, for reference" description={NEXT_CYCLE.note}>
          <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
            {COUNSELLING_DATES.map((d) => (
              <li key={d.event} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-sm text-foreground">{d.event}</span>
                <span className="text-sm tabular-nums text-muted-foreground">{d.date}</span>
              </li>
            ))}
          </ol>
        </PageSection>
      </div>

      <p className="text-body-sm text-muted-foreground">{COUNSELLING_2026.rankUseNote}</p>
    </NimcetPageShell>
  );
}
