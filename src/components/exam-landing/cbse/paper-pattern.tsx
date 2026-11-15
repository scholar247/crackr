import { Info } from 'lucide-react';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';
import type { CbseBoard } from '@/content/exams/cbse/types';

/** Board-level rules (marks split, pass mark) as a row of fact cards. */
export function PatternHighlights({ board }: { board: CbseBoard }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {board.patternHighlights.map((h) => (
        <div key={h.label} className="flex flex-col rounded-xl border border-border bg-card p-5">
          <dt className="text-label-caps uppercase text-muted-foreground">{h.label}</dt>
          <dd className="text-headline-md mt-1 text-foreground">{h.value}</dd>
          <dd className="text-body-sm mt-1 text-muted-foreground">{h.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

// Each subject's section-by-section paper, in syllabus order. Subjects without editorial
// pattern data are skipped rather than shown with made-up numbers.
export function SubjectPatterns({ board, subjects }: { board: CbseBoard; subjects: LandingSubject[] }) {
  const withPattern = subjects.flatMap((s) => {
    const pattern = s.key ? board.patterns[s.key] : undefined;
    return pattern ? [{ subject: s, pattern }] : [];
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {withPattern.map(({ subject, pattern }) => (
        <article key={subject.id} id={`pattern-${subject.slug}`} className="scroll-mt-32 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-body-lg font-semibold text-foreground">
              {board.shortLabel} {subject.name} paper pattern
            </h3>
            <span className="text-body-sm text-muted-foreground">
              {pattern.theoryMarks} theory + {pattern.internalMarks} {pattern.internalLabel} · {pattern.durationHours} hrs
            </span>
          </div>

          {/* Proportional bar: each section's share of the theory paper. */}
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-border" aria-hidden>
            {pattern.sections.map((sec, i) => (
              <div key={sec.name} className={i % 2 === 0 ? 'bg-secondary' : 'bg-secondary/50'} style={{ width: `${(sec.marks / pattern.theoryMarks) * 100}%` }} />
            ))}
          </div>

          <table className="mt-4 w-full text-sm">
            <caption className="sr-only">
              {subject.name} theory paper: sections, questions and marks
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Section</th>
                <th scope="col">Questions</th>
                <th scope="col">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pattern.sections.map((sec) => (
                <tr key={sec.name}>
                  <td className="w-10 py-2 font-mono text-xs font-semibold text-secondary">{sec.name}</td>
                  <td className="py-2 text-foreground">{sec.questionType}</td>
                  <td className="w-12 py-2 text-right font-medium text-foreground tabular-nums">{sec.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pattern.note && (
            <p className="text-body-sm mt-3 flex gap-2 rounded-lg bg-muted/50 p-3 text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {pattern.note}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
