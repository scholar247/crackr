import Link from 'next/link';
import { ArrowRight, Sparkles, FileCheck2, NotebookPen, Target, GraduationCap } from 'lucide-react';
import type { ExamCardData } from '@/lib/exam-stats';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExploreExamsProps {
  /** First entry renders as the large featured card; the rest (up to 4) as small cards. */
  exams: ExamCardData[];
  /** When the featured card's slug matches this, it gets the "🔥 Trending" badge and a
   * subtle hover tilt instead of the plain "Featured" badge — an editorial call, not a
   * computed metric. Omit for a plain reuse of this component (e.g. "explore other exams"). */
  trendingSlug?: string;
  heading?: string;
  description?: string;
}

// Per-exam quick links to the platform's 4 real pillars. Course has no destination yet —
// no payment integration exists — so it renders as a plain "Coming soon" badge, never a
// dead link. The other three point at real, working routes.
function ExamQuickLinks({ slug }: { slug: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
        <GraduationCap className="h-3 w-3" /> Course
        <Badge variant="warning" className="ml-1 px-1.5 py-0 text-[9px]">
          Soon
        </Badge>
      </span>
      <Link
        href={`/exams/${slug}?tab=mock-tests`}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <FileCheck2 className="h-3 w-3" /> Test Series
      </Link>
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <NotebookPen className="h-3 w-3" /> Blogs
      </Link>
      <Link
        href={`/exams/${slug}?tab=subjects`}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Target className="h-3 w-3" /> MCQs
      </Link>
    </div>
  );
}

export function ExploreExams({
  exams,
  trendingSlug,
  heading = 'Explore Targeted Exams',
  description = 'Starting with NIMCET, GATE-CSE, CUET-UG & CBSE — more exams joining as we build out their syllabi.',
}: ExploreExamsProps) {
  if (exams.length === 0) return null;
  const [featured, ...rest] = exams;
  const smallExams = rest.slice(0, 4);
  const isTrending = featured.slug === trendingSlug;

  return (
    <section className="bg-surface-container-lowest py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-headline-lg text-foreground">{heading}</h2>
            <p className="text-body-md mt-1 text-muted-foreground">{description}</p>
          </div>
          <Link
            href="/exams"
            className="text-label-caps hidden shrink-0 items-center gap-1.5 uppercase tracking-wider text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            View All Exams <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-xl',
              isTrending && 'hover:animate-tilt-hover'
            )}
          >
            <Link href={`/exams/${featured.slug}`} className="block">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  {featured.initials}
                </div>
                {isTrending ? (
                  <span className="text-label-caps inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 uppercase text-secondary">
                    🔥 Trending
                  </span>
                ) : (
                  <span className="text-label-caps inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 uppercase text-secondary">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-headline-md text-foreground">{featured.name}</h3>
                {featured.description && <p className="text-body-sm mt-1 text-muted-foreground">{featured.description}</p>}
              </div>
            </Link>

            <ExamQuickLinks slug={featured.slug} />
          </div>

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
                <p className="text-body-sm mt-1 text-muted-foreground">Course · Test Series · Blogs · MCQs</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
