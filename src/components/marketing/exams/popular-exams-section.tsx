import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ExamCardData } from '@/lib/exam-stats';
import { PopularExamsGrid } from './popular-exams-grid';

interface PopularExamsSectionProps {
  exams: ExamCardData[];
  searchParams: { q?: string; program?: string; sort?: string };
}

function buildHref(current: PopularExamsSectionProps['searchParams'], overrides: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...overrides })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/exams?${qs}` : '/exams';
}

export function PopularExamsSection({ exams, searchParams }: PopularExamsSectionProps) {
  const sort = searchParams.sort ?? 'popular';

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg text-foreground">Popular Exams</h2>
            <p className="text-body-md mt-1 text-muted-foreground">Top choices for competitive aspirants this year.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="#browse-by-program"
              className="text-label-caps rounded-full border border-border px-4 py-2 uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              Filters
            </Link>
            <div className="text-body-sm flex items-center gap-1.5 text-muted-foreground">
              Sort:
              <Link
                href={buildHref(searchParams, { sort: 'name' })}
                className={cn('transition-colors hover:text-foreground', sort === 'name' && 'font-semibold text-foreground')}
              >
                Name
              </Link>
              ·
              <Link
                href={buildHref(searchParams, { sort: 'popular' })}
                className={cn('transition-colors hover:text-foreground', sort === 'popular' && 'font-semibold text-foreground')}
              >
                Popularity
              </Link>
            </div>
          </div>
        </div>

        {exams.length === 0 ? (
          <p className="text-body-sm mt-10 text-muted-foreground">
            No exams match your search yet — try a different keyword or{' '}
            <Link href="/exams" className="text-primary hover:underline">
              browse all exams
            </Link>
            .
          </p>
        ) : (
          <PopularExamsGrid exams={exams} />
        )}
      </div>
    </section>
  );
}
