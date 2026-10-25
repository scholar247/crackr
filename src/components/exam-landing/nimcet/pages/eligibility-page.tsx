import { CheckCircle2, FileText } from 'lucide-react';
import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { APPLICATION_FEE_2026, CYCLE_2026, ELIGIBILITY, NEXT_CYCLE, formatRupees } from '@/content/exams/nimcet/official';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';

export function NimcetEligibilityPage() {
  return (
    <NimcetPageShell
      nav="eligibility"
      crumbs={[{ label: 'Eligibility' }]}
      eyebrow={`Official · NIMCET ${ELIGIBILITY.year}`}
      title="NIMCET eligibility criteria"
      intro={
        <>
          Who could apply for NIMCET {ELIGIBILITY.year}: the qualifying degree, minimum marks, and documents. Criteria can change each year, so check the
          brochure for the year you apply.
        </>
      }
      aside={<OfficialSourceNote source={ELIGIBILITY.source} className="lg:max-w-xs" />}
      nextSteps={[STEP.pattern, STEP.syllabus, STEP.strategy]}
    >
      <PageSection id="criteria" title="Who can apply">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-label-caps uppercase text-muted-foreground">Qualifying degree (either)</p>
            <ul className="mt-3 space-y-3">
              {ELIGIBILITY.qualifyingDegrees.map((d) => (
                <li key={d} className="text-body-md flex gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
            <p className="text-body-sm mt-4 text-muted-foreground">Open to {ELIGIBILITY.nationality.toLowerCase()}.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <caption className="px-6 pt-5 text-left">
                <span className="text-label-caps uppercase text-muted-foreground">Minimum marks in the qualifying degree</span>
              </caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ELIGIBILITY.minimumScore.map((r) => (
                  <tr key={r.category}>
                    <th scope="row" className="px-6 py-4 text-left font-medium text-foreground">
                      {r.category}
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{r.requirement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageSection>

      <PageSection id="rules" title="Points to note">
        <ul className="grid gap-3 md:grid-cols-2">
          {ELIGIBILITY.notes.map((n) => (
            <li key={n} className="text-body-md rounded-xl border border-border bg-card p-4 text-muted-foreground">
              {n}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="documents" title="Documents to upload when applying">
        <ul className="grid gap-2 sm:grid-cols-2">
          {ELIGIBILITY.documents.map((d) => (
            <li key={d} className="text-body-md flex gap-3 text-foreground">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="fee" title={`Application fee (${ELIGIBILITY.year})`}>
        <div className="max-w-xl overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">NIMCET {ELIGIBILITY.year} application fee by category</caption>
            <tbody className="divide-y divide-border">
              {APPLICATION_FEE_2026.rows.map((r) => (
                <tr key={r.category}>
                  <th scope="row" className="px-5 py-3 text-left font-medium text-foreground">
                    {r.category}
                  </th>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-foreground">{formatRupees(r.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-body-sm mt-3 text-muted-foreground">
          The fee is non-refundable. In {ELIGIBILITY.year} the application window ran from {CYCLE_2026.dates[0].date} to {CYCLE_2026.dates[1].date}.{' '}
          {NEXT_CYCLE.note}
        </p>
      </PageSection>
    </NimcetPageShell>
  );
}
