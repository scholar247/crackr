import type { ExamCardData } from '@/lib/exam-stats';
import { EXAM_COMPARISON, DEFAULT_EXAM_COMPARISON } from '@/lib/exam-stats';

const ROWS = [
  { key: 'eligibility' as const, label: 'Eligibility' },
  { key: 'coreSubjects' as const, label: 'Core Subjects' },
  { key: 'duration' as const, label: 'Duration' },
];

export function CompareExams({ exams }: { exams: ExamCardData[] }) {
  if (exams.length === 0) return null;

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Compare Top Exams</h2>
        <p className="text-body-md mt-1 text-muted-foreground">Quick overview of leading competitive entrances.</p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="bg-foreground text-background">
                <th className="text-label-caps px-5 py-4 uppercase tracking-wide">Exam Parameters</th>
                {exams.map((exam) => (
                  <th key={exam.id} className="text-label-caps px-5 py-4 uppercase tracking-wide">
                    {exam.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="text-body-sm px-5 py-4 font-semibold text-foreground">{row.label}</td>
                  {exams.map((exam) => {
                    const comparison = EXAM_COMPARISON[exam.slug] ?? DEFAULT_EXAM_COMPARISON;
                    return (
                      <td key={exam.id} className="text-body-sm px-5 py-4 text-muted-foreground">
                        {comparison[row.key]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
