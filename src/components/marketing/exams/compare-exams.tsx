import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FinderExam } from '@/components/marketing/exams/exam-finder';

const ROWS: { label: string; get: (e: FinderExam) => string }[] = [
  { label: 'Program', get: (e) => e.programName },
  { label: 'Chapters', get: (e) => e.chapters.toLocaleString('en-IN') },
  { label: 'Practice MCQs', get: (e) => e.mcqs.toLocaleString('en-IN') },
  { label: 'PYQs', get: (e) => e.pyqs.toLocaleString('en-IN') },
  { label: 'Mock tests', get: (e) => e.mockTests.toLocaleString('en-IN') },
];

// Decision support for the undecided: the exams with the most content, side by side, using
// the same real counts as the cards above.
export function CompareExams({ exams }: { exams: FinderExam[] }) {
  if (exams.length < 2) return null;

  return (
    <section className="py-14 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-label-caps uppercase tracking-wider text-primary">Not sure yet?</p>
          <h2 className="text-headline-lg mt-1 text-foreground">Compare our most complete exams</h2>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-label-caps w-40 px-5 py-4 uppercase tracking-wider text-muted-foreground">Exam</th>
                {exams.map((e) => (
                  <th key={e.id} className="text-body-md px-5 py-4 font-semibold text-foreground">
                    {e.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="text-body-sm px-5 py-3.5 font-medium text-muted-foreground">{row.label}</td>
                  {exams.map((e) => (
                    <td key={e.id} className="text-body-sm px-5 py-3.5 tabular-nums text-foreground">
                      {row.get(e)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-muted/20">
                <td />
                {exams.map((e) => (
                  <td key={e.id} className="px-5 py-4">
                    <Link
                      href={`/exams/${e.slug}`}
                      className="text-body-sm inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      View exam <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
