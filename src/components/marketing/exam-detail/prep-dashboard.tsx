import Link from 'next/link';
import { ArrowRight, ClipboardList, Target, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';

// Illustrative — no attempt-tracking is wired yet (assessments/assessmentAttempts exist in
// schema but nothing reads/writes them today). Numbers here are a placeholder for the
// logged-in layout until real per-user progress queries are built.
const PLACEHOLDER_PROGRESS = {
  syllabusCompletion: 42,
  weeklyDelta: '+5% this week',
  questionsAttempted: '1,284',
  accuracy: '78%',
};

export async function PrepDashboard() {
  const session = await auth();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-headline-lg text-foreground">Your Prep Dashboard</h2>
          <p className="text-body-md mt-1 text-muted-foreground">Visual summary of your learning progress.</p>
        </div>
        {session?.user && (
          <Link
            href="/dashboard"
            className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary hover:text-primary/80"
          >
            Detailed Analytics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {session?.user ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <p className="text-label-caps uppercase text-muted-foreground">Overall Syllabus Completion</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-display-lg text-foreground">{PLACEHOLDER_PROGRESS.syllabusCompletion}%</span>
              <span className="text-label-caps rounded-full bg-secondary/10 px-2.5 py-1 uppercase text-secondary">
                {PLACEHOLDER_PROGRESS.weeklyDelta}
              </span>
            </div>

            <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${PLACEHOLDER_PROGRESS.syllabusCompletion}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
              <span>Foundation Phase</span>
              <span>Practice Phase</span>
              <span>Revision Phase</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-foreground p-5 text-background">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/10">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <span className="text-[11px] text-background/60">Last 30 days</span>
              </div>
              <p className="text-headline-md mt-4">{PLACEHOLDER_PROGRESS.questionsAttempted}</p>
              <p className="text-[11px] uppercase tracking-wide text-background/60">Questions Attempted</p>
            </div>

            <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-headline-md mt-4 text-foreground">{PLACEHOLDER_PROGRESS.accuracy}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Overall Accuracy</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <p className="text-body-lg font-semibold text-foreground">Track Your Progress</p>
            <p className="text-body-sm mt-1 max-w-sm text-muted-foreground">
              Sign in to see your personalized prep dashboard — syllabus completion, questions attempted, and accuracy.
            </p>
          </div>
          <Button asChild className="text-label-caps rounded-full uppercase tracking-wider">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
