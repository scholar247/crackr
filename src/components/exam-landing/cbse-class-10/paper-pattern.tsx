import { FileText, Info } from 'lucide-react';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { LandingSubject } from '@/server/services/exam-landing/cbse-class-10';
import { PATTERN_HIGHLIGHTS, SUBJECT_PATTERNS } from './content';

// Board-level rules first (marks split, pass mark), then each subject's section-by-section
// paper, in the same subject order as the syllabus above.
export function PaperPattern({ subjects }: { subjects: LandingSubject[] }) {
  const withPattern = subjects.flatMap((s) => (s.key ? [{ subject: s, pattern: SUBJECT_PATTERNS[s.key] }] : []));

  return (
    <LandingSection id="pattern" muted>
      <SectionHeader
        eyebrow="Paper pattern"
        icon={<FileText className="h-3.5 w-3.5" />}
        title="How the board paper is set"
        description="Every main subject has an 80-mark written paper and 20 marks of internal assessment from your school."
      />

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PATTERN_HIGHLIGHTS.map((h) => (
          <div key={h.label} className="rounded-xl border border-border bg-card p-5">
            <dt className="text-label-caps uppercase text-muted-foreground">{h.label}</dt>
            <dd className="text-headline-md mt-1 text-foreground">{h.value}</dd>
            <dd className="text-body-sm mt-1 text-muted-foreground">{h.detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {withPattern.map(({ subject, pattern }) => (
          <article key={subject.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-body-lg font-semibold text-foreground">{subject.name}</h3>
              <span className="text-body-sm text-muted-foreground">
                {pattern.theoryMarks} + {pattern.internalMarks} marks · {pattern.durationHours} hrs
              </span>
            </div>

            {/* Proportional bar: each section's share of the 80-mark paper. */}
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-border" aria-hidden>
              {pattern.sections.map((sec, i) => (
                <div
                  key={sec.name}
                  className={i % 2 === 0 ? 'bg-secondary' : 'bg-secondary/50'}
                  style={{ width: `${(sec.marks / pattern.theoryMarks) * 100}%` }}
                />
              ))}
            </div>

            <table className="mt-4 w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Section</th>
                  <th>Questions</th>
                  <th>Marks</th>
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

      <p className="mt-4 text-xs text-muted-foreground">
        Based on the CBSE 2025–26 sample question papers. Check the official sample papers for your session before the exam.
      </p>
    </LandingSection>
  );
}
