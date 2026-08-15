import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ExamCardData } from '@/lib/exam-stats';

interface ExploreExamsProps {
  /** First entry renders as the large featured card; the rest (up to 4) as small cards. */
  exams: ExamCardData[];
}

export function ExploreExams({ exams }: ExploreExamsProps) {
  if (exams.length === 0) return null;
  const [featured, ...rest] = exams;
  const smallExams = rest.slice(0, 4);

  return (
    <section className="bg-surface-container-lowest py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-headline-lg text-foreground">Explore Targeted Exams</h2>
            <p className="text-body-md mt-1 text-muted-foreground">
              Select your target to access curated study plans and specialized question banks.
            </p>
          </div>
          <Link
            href="/exams"
            className="text-label-caps hidden shrink-0 items-center gap-1.5 uppercase tracking-wider text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            View All Exams <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Link
            href={`/exams/${featured.slug}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                {featured.initials}
              </div>
              <span className="text-label-caps inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 uppercase text-secondary">
                <Sparkles className="h-3 w-3" /> Trending
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-headline-md text-foreground">{featured.name}</h3>
              {featured.description && <p className="text-body-sm mt-1 text-muted-foreground">{featured.description}</p>}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-body-sm text-muted-foreground">{featured.stats.mocks} Mocks</span>
              <span className="text-body-sm text-muted-foreground">{featured.stats.mcqs} MCQs</span>
            </div>
          </Link>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {smallExams.map((exam) => (
              <Link
                key={exam.id}
                href={`/exams/${exam.slug}`}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-body-sm font-semibold text-muted-foreground">
                  {exam.initials}
                </div>
                <h3 className="text-body-md mt-3 font-semibold text-foreground">{exam.name}</h3>
                <p className="text-body-sm mt-1 text-muted-foreground">{exam.stats.mcqs} Questions</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
