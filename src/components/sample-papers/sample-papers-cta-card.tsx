import Link from 'next/link';
import { ArrowRight, Clock, FileCheck2, FileText, Layers } from 'lucide-react';
import { loadSamplePaperExam } from '@/server/services/sample-papers';
import { periodLabel, samplePapersPath } from '@/lib/sample-papers';
import { cn } from '@/lib/utils';

/**
 * The single entry point to an exam's sample papers from its landing page, shown on every
 * exam: a card linking to /exams/{slug}/sample-papers. With papers published it shows what's
 * there; before that it's a muted "coming soon" card — the hub it links to explains the
 * wait instead of erroring. Fetches its own data, so it can be dropped onto any exam page.
 */
export async function SamplePapersCtaCard({ examSlug }: { examSlug: string }) {
  const data = await loadSamplePaperExam(examSlug);
  if (!data) return null;

  const { config, papers, years, latestYear } = data;
  const ready = latestYear !== null;
  const latestCount = ready ? papers.filter((p) => p.year === latestYear).length : 0;
  const hasSchemes = ready && papers.some((p) => p.year === latestYear && p.hasMarkingScheme);

  const chip = 'flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1';

  return (
    <section id="sample-papers" aria-labelledby="sample-papers-cta" className="scroll-mt-32 bg-background py-10">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <Link
          href={samplePapersPath(examSlug)}
          className={cn(
            'group relative flex flex-col gap-6 overflow-hidden rounded-2xl border bg-card p-6 transition-all sm:p-8 md:flex-row md:items-center md:justify-between',
            ready ? 'border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5' : 'border-dashed border-border hover:border-primary/30',
          )}
        >
          {ready && <span aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-80" />}

          <div className="relative flex items-start gap-5">
            <span className="relative hidden h-16 w-14 shrink-0 sm:block" aria-hidden>
              {/* Stacked-paper motif: the latest paper on top of earlier ones. */}
              <span className="absolute inset-0 translate-x-2 -translate-y-1 rotate-6 rounded-lg border border-border bg-surface-container-lowest" />
              <span className="absolute inset-0 translate-x-1 rotate-3 rounded-lg border border-border bg-surface-container-lowest" />
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center rounded-lg border transition-transform group-hover:-translate-y-0.5',
                  ready ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground',
                )}
              >
                <FileText className="h-6 w-6" />
              </span>
            </span>

            <div className="max-w-xl">
              <p className={cn('text-label-caps uppercase tracking-wider', ready ? 'text-primary' : 'text-muted-foreground')}>Sample papers</p>
              <h2 id="sample-papers-cta" className="text-headline-md mt-1 text-foreground">
                {config.label} Sample Papers{ready ? ` ${periodLabel(config, latestYear)}` : ''}
              </h2>
              <p className="text-body-md mt-1.5 text-muted-foreground">
                {ready
                  ? `Official sample papers with marking schemes. Pick a ${config.isBoard ? 'session' : 'year'} and a subject, then read the paper right here.`
                  : 'Official sample papers and marking schemes will appear here as soon as they’re released.'}
              </p>
              <ul className="text-body-sm mt-4 flex flex-wrap gap-2 text-muted-foreground">
                {ready ? (
                  <>
                    <li className={chip}>
                      <FileText className="h-3.5 w-3.5 text-primary" /> {latestCount} subject{latestCount === 1 ? '' : 's'}
                    </li>
                    {hasSchemes && (
                      <li className={chip}>
                        <FileCheck2 className="h-3.5 w-3.5 text-secondary" /> Marking schemes
                      </li>
                    )}
                    <li className={chip}>
                      <Layers className="h-3.5 w-3.5 text-tertiary" /> {years.length} {config.isBoard ? 'session' : 'year'}
                      {years.length === 1 ? '' : 's'}
                    </li>
                  </>
                ) : (
                  <li className={chip}>
                    <Clock className="h-3.5 w-3.5" /> Coming soon
                  </li>
                )}
              </ul>
            </div>
          </div>

          <span
            className={cn(
              'relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-6 py-3 text-sm font-semibold transition-colors md:self-center',
              ready ? 'bg-primary text-primary-foreground group-hover:bg-primary/90' : 'border border-border bg-background text-foreground group-hover:border-primary/40',
            )}
          >
            {ready ? 'Browse sample papers' : 'View sample papers'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
