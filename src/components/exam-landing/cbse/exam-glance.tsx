import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { LandingSection } from '@/components/exam-landing/shared/section-header';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';

/** Key exam facts (dates, marks split, pass mark) in one strip. */
export function ExamGlance({ board }: { board: CbseBoard }) {
  return (
    <LandingSection id="at-a-glance" muted>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-headline-md flex items-center gap-2 text-foreground">
          <CalendarClock className="h-5 w-5 text-secondary" aria-hidden /> {board.label} exam at a glance
        </h2>
        <Link href={cbsePath(board.examSlug, 'paper-pattern')} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Full {board.shortLabel} paper pattern <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {board.keyFacts.map((f) => (
          <div key={f.label} className="flex flex-col rounded-xl border border-border bg-card p-5">
            <dt className="text-label-caps uppercase text-muted-foreground">{f.label}</dt>
            <dd className="text-body-md mt-1 font-semibold text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
    </LandingSection>
  );
}
