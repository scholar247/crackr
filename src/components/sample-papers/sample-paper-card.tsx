import { createElement } from 'react';
import Link from 'next/link';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { samplePapersPath } from '@/lib/sample-papers';
import { cn } from '@/lib/utils';
import { subjectIcon, subjectTone } from './subject-visual';

export interface SubjectCardPaper {
  id: string;
  year: number;
  subject: string;
  subjectSlug: string;
  hasMarkingScheme: boolean;
}

/** Step 2: one subject. The whole card links to that subject's paper page. */
export function SamplePaperCard({ examSlug, paper }: { examSlug: string; paper: SubjectCardPaper }) {
  return (
    <Link
      href={samplePapersPath(examSlug, paper.year, paper.subjectSlug)}
      className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
    >
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform group-hover:scale-105', subjectTone(paper.subjectSlug))}>
        {createElement(subjectIcon(paper.subject), { className: 'h-5 w-5' })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-foreground">{paper.subject}</span>
        <span className="text-body-sm mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          {paper.hasMarkingScheme ? (
            <>
              <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-secondary" /> Paper + marking scheme
            </>
          ) : (
            'Question paper'
          )}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

/** Strips fields the client grid doesn't need (e.g. Dates) before crossing the RSC boundary. */
export function toCardPapers(papers: SubjectCardPaper[]): SubjectCardPaper[] {
  return papers.map(({ id, year, subject, subjectSlug, hasMarkingScheme }) => ({ id, year, subject, subjectSlug, hasMarkingScheme }));
}
