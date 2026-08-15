import Link from 'next/link';
import { ListChecks, Gauge, AlertTriangle, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';

// Illustrative — no attempt-tracking is wired yet (same caveat as the exam detail page's
// prep-dashboard.tsx). Placeholder numbers until real per-user practice queries are built.
const PLACEHOLDER = {
  attempted: 42,
  goal: 50,
  accuracy: 81,
  accuracyDelta: '+3% from yesterday',
  focusAreas: ['Probability', 'Permutations'],
  pickTopic: 'Probability',
};

export async function TodaysPractice() {
  const session = await auth();

  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Today&apos;s Practice</h2>
        <p className="text-body-md mt-1 text-muted-foreground">Your performance metrics for the current session.</p>

        {session?.user ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListChecks className="h-4 w-4" />
                </div>
                <p className="text-label-caps mt-3 uppercase text-muted-foreground">Attempted</p>
                <p className="text-headline-md text-foreground">
                  {PLACEHOLDER.attempted}
                  <span className="text-body-sm text-muted-foreground"> / {PLACEHOLDER.goal} Goal</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${(PLACEHOLDER.attempted / PLACEHOLDER.goal) * 100}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Gauge className="h-4 w-4" />
                </div>
                <p className="text-label-caps mt-3 uppercase text-muted-foreground">Accuracy</p>
                <p className="text-headline-md text-foreground">{PLACEHOLDER.accuracy}%</p>
                <p className="text-body-sm mt-2 text-secondary">{PLACEHOLDER.accuracyDelta}</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <p className="text-label-caps mt-3 uppercase text-muted-foreground">Focus Areas</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PLACEHOLDER.focusAreas.map((area) => (
                    <span key={area} className="text-label-caps rounded-full bg-destructive/10 px-2.5 py-1 uppercase text-destructive">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-foreground p-6 text-background">
              <span className="text-label-caps inline-flex items-center gap-1.5 uppercase tracking-wider text-background/60">
                <Sparkles className="h-3.5 w-3.5" /> Intelligence Pick
              </span>
              <p className="text-headline-md mt-3">Master {PLACEHOLDER.pickTopic}</p>
              <Button
                className="text-label-caps mt-6 w-full rounded-full bg-background uppercase tracking-wider text-foreground hover:bg-background/90"
                asChild
              >
                <Link href="/exams">
                  Practice Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <p className="text-body-lg font-semibold text-foreground">Track Today&apos;s Session</p>
              <p className="text-body-sm mt-1 max-w-sm text-muted-foreground">
                Sign in to see your live practice metrics — questions attempted, accuracy, and personalized focus areas.
              </p>
            </div>
            <Button asChild className="text-label-caps rounded-full uppercase tracking-wider">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
