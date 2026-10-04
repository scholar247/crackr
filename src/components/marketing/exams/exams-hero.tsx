import Link from 'next/link';
import { GraduationCap, LayoutGrid, ListChecks, Search } from 'lucide-react';
import { ExamSearchBox, type ExamSearchBoxProps } from '@/components/marketing/exam-search-box';
import { CountUp } from '@/components/marketing/home/count-up';
import type { PlatformStats } from '@/server/repositories/exam-spotlight.repository';

interface ExamsHeroProps {
  q?: string;
  exams: ExamSearchBoxProps['exams'];
  programs: ExamSearchBoxProps['programs'];
  popularExams: { slug: string; name: string }[];
  stats: PlatformStats;
}

// Directory hero: same visual language as the homepage hero (centered, ambient glow, stat
// bar) but the search box is the primary action. Stats are real counts, zeros hidden.
export function ExamsHero({ q, exams, programs, popularExams, stats }: ExamsHeroProps) {
  const statItems = [
    { icon: GraduationCap, tone: 'text-primary', value: stats.exams, label: 'Exams' },
    { icon: LayoutGrid, tone: 'text-secondary', value: programs.length, label: 'Programs' },
    { icon: ListChecks, tone: 'text-tertiary', value: stats.mcqs, label: 'Practice MCQs' },
  ].filter((s) => s.value > 0);

  return (
    <section className="relative overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/25 via-secondary/20 to-tertiary/20 opacity-70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-page px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-3 w-3" />
            </span>
            <span className="text-label-caps text-muted-foreground">Exam directory</span>
          </div>

          <h1 className="text-headline-xl mt-6 tracking-tight text-foreground sm:text-5xl lg:text-[56px] lg:leading-[64px]">
            Find Your Exam. <br className="hidden sm:inline" />
            <span className="text-gradient-brand">Start Preparing Today.</span>
          </h1>

          <p className="text-body-lg mt-5 max-w-2xl text-muted-foreground">
            Search every exam we cover — then jump straight into its syllabus, practice sets and mock tests.
          </p>

          <div className="mt-8 w-full">
            <ExamSearchBox q={q} exams={exams} programs={programs} className="max-w-2xl" />

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

          {statItems.length > 0 && (
            <div className="mt-10 w-full rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {statItems.map(({ icon: Icon, tone, value, label }) => (
                  <div key={label} className="flex items-center justify-center gap-2.5">
                    <Icon className={`h-5 w-5 shrink-0 ${tone}`} />
                    <div className="text-left">
                      <p className="text-base font-semibold leading-tight text-foreground">
                        <CountUp value={value} />
                      </p>
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
