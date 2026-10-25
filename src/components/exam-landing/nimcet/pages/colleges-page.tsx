import Link from 'next/link';
import { ExternalLink, Info, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { INSTITUTES_2026, SOURCES, formatRupees, instituteSeats } from '@/content/exams/nimcet/official';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';

export function NimcetCollegesPage() {
  const { institutes, totalSeats, year, notes, source } = INSTITUTES_2026;
  const session = `${year}–${String(year + 1).slice(2)}`;

  return (
    <NimcetPageShell
      nav="colleges"
      crumbs={[{ label: 'Colleges' }]}
      eyebrow={`Official · ${session} admissions`}
      title="NIMCET participating colleges: seats and fees"
      intro={`${institutes.length} institutes (${institutes.filter((i) => i.kind === 'NIT').length} NITs and ${institutes.filter((i) => i.kind === 'IIIT').length} IIITs) offered ${totalSeats.toLocaleString('en-IN')} MCA seats through NIMCET ${year}. Seats and fees change each year.`}
      aside={<OfficialSourceNote source={source} className="lg:max-w-xs" />}
      nextSteps={[STEP.counselling, STEP.eligibility, STEP.overview]}
    >
      <PageSection id="institutes" title={`Institutes, seats and semester fees (${session})`} description="Seats are the total across all categories. Fees are per semester, for six semesters.">
        <ul className="grid gap-4 lg:grid-cols-2">
          {institutes.map((i) => (
            <li key={i.slug} id={i.slug} className="scroll-mt-32 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{i.name}</h3>
                  <p className="text-body-sm flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {i.city}, {i.state}
                  </p>
                </div>
                <Badge variant="secondary">{instituteSeats(i)} seats</Badge>
              </div>
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">{i.name} MCA programmes, seats and fees</caption>
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="pb-2 font-medium">Programme</th>
                    <th scope="col" className="pb-2 text-right font-medium">Seats</th>
                    <th scope="col" className="pb-2 text-right font-medium">Fee / semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {i.programmes.map((p) => {
                    const varies = new Set(p.semesterFees).size > 1;
                    return (
                      <tr key={p.label}>
                        <th scope="row" className="py-2 pr-2 text-left font-normal text-foreground">
                          {p.label}
                          <span className="block text-xs text-muted-foreground">
                            {p.feeBasis === 'consolidated' ? 'Consolidated fee' : 'Tuition fee only'}
                            {p.feeNote && ` · ${p.feeNote}`}
                          </span>
                        </th>
                        <td className="py-2 text-right align-top tabular-nums">{p.seats}</td>
                        <td className="py-2 text-right align-top tabular-nums">
                          {varies
                            ? `${formatRupees(Math.min(...p.semesterFees))}–${formatRupees(Math.max(...p.semesterFees))}`
                            : formatRupees(p.semesterFees[0])}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <a
                href={i.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Official website <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">of {i.name} (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <ul className="text-body-sm mt-4 space-y-1 text-muted-foreground">
          {notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="cutoffs" title="Opening and closing ranks">
        <div className="text-body-md flex gap-3 rounded-2xl border border-border bg-muted/40 p-5 text-muted-foreground">
          <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          <p>
            We don’t publish cutoff ranks yet because we don’t have verified, year-wise opening and closing ranks for each institute and category.
            Seat allotment results are published on the{' '}
            <a href={SOURCES.site.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              official NIMCET website
            </a>
            . Past cutoffs only describe past years and are not a guaranteed threshold for the next admission cycle.
          </p>
        </div>
        <p className="text-body-sm mt-3 text-muted-foreground">
          See also the official{' '}
          <a href={SOURCES.seatMatrix.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            seat matrix
          </a>{' '}
          and{' '}
          <a href={SOURCES.institutes.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            institute list
          </a>
          , and{' '}
          <Link href={`${NIMCET_PATH}/admission-counselling`} className="font-medium text-primary hover:underline">
            how counselling works
          </Link>
          .
        </p>
      </PageSection>
    </NimcetPageShell>
  );
}
