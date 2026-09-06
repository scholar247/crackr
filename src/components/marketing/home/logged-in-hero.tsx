import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressStatCard } from '@/components/progress/progress-stat-card';
import { ProgressLineChart } from '@/components/progress/progress-line-chart';
import { progressColorFor } from '@/components/progress/progress-chart-colors';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';

interface LoggedInHeroProps {
  firstName: string;
  examName: string;
  examSlug: string;
  /** The exam-progress row matching the user's primary exam, or null if they haven't taken
   * a mock for it yet. Passed through verbatim from getUserProgress — never recomputed. */
  progress: ProgressGroup | null;
}

// Section 7.1 (greeting + stat card) and 7.3 (mini trend chart) live together — they're one
// contiguous "here's where you stand" block, not two independent sections. Stat display
// reuses ProgressStatCard wholesale rather than hand-rolling new "stat chip" markup — same
// card, same hover-lift, same Personal Best treatment already shipped on /progress.
export function LoggedInHero({ firstName, examName, examSlug, progress }: LoggedInHeroProps) {
  const isNewBest = !!progress && progress.series.length > 1 && progress.latestPercentage >= progress.bestPercentage;

  return (
    <section className="bg-background py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline-lg text-foreground">Welcome back, {firstName}</h1>
          <Badge variant="info">{examName}</Badge>
        </div>

        {!progress ? (
          <Card className="mt-6 border-dashed">
            <CardHeader className="items-center text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2">Take Your First {examName} Mock</CardTitle>
              <CardDescription>Once you do, your score trend and personal bests show up right here.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button asChild size="sm">
                <Link href="/mocks/new">Start a Mock</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="relative lg:col-span-1">
              {isNewBest && (
                <Sparkles
                  className="animate-sparkle-pop pointer-events-none absolute -right-2 -top-2 z-10 h-6 w-6 text-warning"
                  aria-hidden="true"
                />
              )}
              <ProgressStatCard group={progress} accent={progressColorFor(0)} href={`/exams/${examSlug}`} />
            </div>

            {progress.series.length >= 2 && (
              <Card className="lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Your Score Trend</CardTitle>
                    <CardDescription>Every {examName} mock you&apos;ve taken, in order.</CardDescription>
                  </div>
                  <Link
                    href="/progress"
                    className="text-label-caps hidden shrink-0 items-center gap-1.5 uppercase tracking-wider text-primary transition-colors hover:text-primary/80 sm:flex"
                  >
                    View Full Progress <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <ProgressLineChart groups={[progress]} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
