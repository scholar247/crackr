import Link from 'next/link';
import { ArrowRight, CalendarDays, FileCheck2, FileText } from 'lucide-react';
import { examEvent, periodLabel, samplePapersPath, type SamplePaperExamConfig } from '@/lib/sample-papers';
import type { PublicSamplePaper } from '@/server/repositories/sample-paper.repository';
import { cn } from '@/lib/utils';

interface YearSummary {
  year: number;
  subjects: number;
  schemes: number;
}

export function summariseYears(papers: PublicSamplePaper[]): YearSummary[] {
  const map = new Map<number, YearSummary>();
  for (const p of papers) {
    const y = map.get(p.year) ?? { year: p.year, subjects: 0, schemes: 0 };
    y.subjects += 1;
    if (p.hasMarkingScheme) y.schemes += 1;
    map.set(p.year, y);
  }
  return [...map.values()].sort((a, b) => b.year - a.year);
}

/** Step 1: one card per session (boards) or year (other exams), newest first and highlighted. */
export function YearGrid({ examSlug, cfg, years }: { examSlug: string; cfg: SamplePaperExamConfig; years: YearSummary[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {years.map((y, i) => {
        const latest = i === 0;
        return (
          <li key={y.year}>
            <Link
              href={samplePapersPath(examSlug, y.year)}
              className={cn(
                'group relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
                latest ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border hover:border-primary/40',
              )}
            >
              {latest && <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />}

              <div className="relative flex items-start justify-between gap-3">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', latest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary')}>
                  <CalendarDays className="h-5 w-5" />
                </span>
                {latest && <span className="text-label-caps rounded-full bg-primary/10 px-2.5 py-1 uppercase tracking-wider text-primary">Latest</span>}
              </div>

              <div className="relative">
                <p className="text-label-caps uppercase tracking-wider text-muted-foreground">{cfg.isBoard ? 'Session' : 'Year'}</p>
                <h3 className="text-headline-lg font-semibold tabular-nums text-foreground">{periodLabel(cfg, y.year)}</h3>
                <p className="text-body-sm mt-1 text-muted-foreground">
                  For the {examEvent(cfg, y.year)}
                </p>
              </div>

              <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-body-sm flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> {y.subjects} subject{y.subjects === 1 ? '' : 's'}
                  </span>
                  {y.schemes > 0 && (
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-secondary" /> {y.schemes} marking scheme{y.schemes === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
