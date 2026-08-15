import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ExamCardData } from '@/lib/exam-stats';

interface TargetedExam extends ExamCardData {
  categoryTag: string;
}

export function TargetedExamPractice({ exams }: { exams: TargetedExam[] }) {
  if (exams.length === 0) return null;

  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-headline-lg text-foreground">Targeted Exam Practice</h2>
            <p className="text-body-md mt-1 text-muted-foreground">Select an exam to load a customized syllabus framework.</p>
          </div>
          <Link
            href="/exams"
            className="text-label-caps hidden shrink-0 items-center gap-1.5 uppercase tracking-wider text-primary hover:text-primary/80 sm:flex"
          >
            View All Exams <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/practice/exams/${exam.slug}`}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-body-sm font-semibold text-background">
                  {exam.initials}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{exam.categoryTag}</span>
              </div>
              <p className="text-body-lg mt-4 font-semibold text-foreground">{exam.name}</p>
              {exam.description && <p className="text-body-sm mt-1 line-clamp-2 text-muted-foreground">{exam.description}</p>}
              <p className="text-body-sm mt-4 text-muted-foreground">{exam.stats.mcqs} Qs</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
