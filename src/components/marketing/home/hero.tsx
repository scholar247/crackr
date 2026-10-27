import Link from 'next/link';
import { ArrowRight, BookOpenCheck, FileCheck2, GraduationCap, ListChecks, Newspaper, Sparkles } from 'lucide-react';
import { ExamSearchBox, type ExamSearchBoxProps } from '@/components/marketing/exam-search-box';
import { CountUp } from '@/components/marketing/home/count-up';
import type { PlatformStats } from '@/server/repositories/exam-spotlight.repository';

interface HeroProps {
  /** Active exam names, in display order — used to name the exams in the subheadline. */
  examNames: string[];
  stats: PlatformStats;
  /** Everything the hero search can match — the same list the explorer below is built from. */
  searchExams: ExamSearchBoxProps['exams'];
  searchPrograms: ExamSearchBoxProps['programs'];
  /** Quick-jump chips straight to an exam page. */
  popularExams: { slug: string; name: string }[];
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function Hero({ examNames, stats, searchExams, searchPrograms, popularExams }: HeroProps) {
  const named = examNames.slice(0, 4);
  const statItems = [
    { icon: GraduationCap, tone: 'text-primary', value: stats.exams, label: 'Exams covered' },
    { icon: ListChecks, tone: 'text-secondary', value: stats.mcqs, label: 'Practice MCQs' },
    { icon: FileCheck2, tone: 'text-tertiary', value: stats.mockTests, label: 'Mock tests' },
    { icon: Newspaper, tone: 'text-primary', value: stats.articles, label: 'Concept articles' },
  ].filter((s) => s.value > 0);

  return (
    <section className="relative overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/25 via-secondary/20 to-tertiary/20 opacity-70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-page px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="text-label-caps text-muted-foreground">The 3-stage preparation framework</span>
          </div>

          <h1 className="text-headline-xl mt-6 tracking-tight text-foreground sm:text-5xl lg:text-[56px] lg:leading-[64px]">
            Learn Concepts. Practice Daily. <br className="hidden sm:inline" />
            <span className="text-gradient-brand">Benchmark Your Rank.</span>
          </h1>

          <p className="text-body-lg mt-5 max-w-2xl text-muted-foreground">
            Structured, active preparation
            {named.length > 0 ? ` for ${joinNames(named)} aspirants` : ' for competitive exam aspirants'}. Theory,
            practice and mock tests built by people who&apos;ve taken these exams.
          </p>

          <div className="mt-8 w-full">
            <ExamSearchBox exams={searchExams} programs={searchPrograms} className="max-w-2xl" />

            {popularExams.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-body-sm text-muted-foreground">Popular:</span>
                {popularExams.map((exam) => (
                  <Link
                    key={exam.slug}
                    href={`/exams/${exam.slug}`}
                    className="text-label-caps rounded-full border border-border bg-card px-3 py-1 uppercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {exam.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/exams"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-shadow hover:shadow-xl sm:w-auto"
            >
              Explore exams
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#exam-explorer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/50 sm:w-auto"
            >
              <BookOpenCheck className="h-5 w-5 text-primary" />
              Browse exam syllabi
            </Link>
          </div>

          {statItems.length > 0 && (
            <div className="mt-10 w-full rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {statItems.map(({ icon: Icon, tone, value, label }) => (
                  <div key={label} className="flex items-center justify-center gap-2.5">
                    <Icon className={`h-5 w-5 shrink-0 ${tone}`} />
                    <div className="text-left">
                      <p className="text-base font-semibold leading-tight text-foreground"><CountUp value={value} /></p>
                      <p className="text-label-caps text-muted-foreground">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
