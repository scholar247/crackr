import Link from 'next/link';
import { ArrowRight, LineChart, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyPractice } from '@/components/marketing/home/daily-practice';
import { ProgressStatCard } from '@/components/progress/progress-stat-card';
import { progressColorFor } from '@/components/progress/progress-chart-colors';
import type { DailyProblem } from '@/server/repositories/exam-spotlight.repository';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';

interface PracticeSectionProps {
  exam: { name: string; slug: string };
  /** "Class 10" — used in copy. */
  classLabel: string;
  dailyProblem: DailyProblem | null;
  subjects: LandingSubject[];
  practiceHref: string;
  totalQuestions: number;
  signedIn: boolean;
  progress: ProgressGroup | null;
}

// Question of the day, then practice by subject next to the student's progress.
export function PracticeSection({ exam, classLabel, dailyProblem, subjects, practiceHref, totalQuestions, signedIn, progress }: PracticeSectionProps) {
  const rowClass = 'flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3';
  const linkRowClass = `group ${rowClass} transition-colors hover:border-primary/40 hover:bg-primary/5`;
  const arrow = (
    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
  );

  return (
    <div>
      <DailyPractice examName={classLabel} examSlug={exam.slug} problem={dailyProblem} practiceHref={practiceHref} />

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-body-lg font-semibold text-foreground">Practise by subject</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <li className="sm:col-span-2">
              <Link href={practiceHref} className={linkRowClass}>
                <span>
                  <span className="block font-medium text-foreground">All subjects (mixed)</span>
                  <span className="text-body-sm text-muted-foreground">{totalQuestions.toLocaleString('en-IN')} questions</span>
                </span>
                {arrow}
              </Link>
            </li>
            {subjects.map((s) => (
              <li key={s.id}>
                {/* A subject with no tagged questions would open an empty practice set — show it, but not as a link. */}
                {s.questionCount > 0 ? (
                  <Link href={s.practiceHref} className={linkRowClass}>
                    <span>
                      <span className="block font-medium text-foreground">{s.name}</span>
                      <span className="text-body-sm text-muted-foreground">{s.questionCount.toLocaleString('en-IN')} questions</span>
                    </span>
                    {arrow}
                  </Link>
                ) : (
                  <div className={`${rowClass} opacity-60`} aria-disabled="true">
                    <span>
                      <span className="block font-medium text-foreground">{s.name}</span>
                      <span className="text-body-sm text-muted-foreground">Coming soon</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <ProgressPanel examSlug={exam.slug} classLabel={classLabel} signedIn={signedIn} progress={progress} />
      </div>
    </div>
  );
}

// Real progress only (from mock attempts) — a nudge to sign in or take a first mock otherwise,
// never placeholder numbers.
function ProgressPanel({ examSlug, classLabel, signedIn, progress }: { examSlug: string; classLabel: string; signedIn: boolean; progress: ProgressGroup | null }) {
  if (signedIn && progress) {
    return (
      <div className="flex flex-col gap-3">
        <ProgressStatCard group={progress} accent={progressColorFor(0)} href="/progress" />
        <Link href="/progress" className="text-sm font-semibold text-primary hover:underline">
          See detailed progress →
        </Link>
      </div>
    );
  }

  const content = signedIn
    ? {
        icon: <LineChart className="h-5 w-5" />,
        title: 'Your progress shows up here',
        description: `Take your first ${classLabel} mock and your scores, best result and trend appear here.`,
        cta: { href: '/mocks/new/self', label: 'Build a mock' },
      }
    : {
        icon: <LogIn className="h-5 w-5" />,
        title: 'Track your progress',
        description: 'Sign in to save your answers and see your scores and trends across mocks.',
        cta: { href: `/sign-in?callbackUrl=${encodeURIComponent(`/exams/${examSlug}/practice`)}`, label: 'Sign in' },
      };

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">{content.icon}</div>
      <div>
        <h3 className="text-body-lg font-semibold text-foreground">{content.title}</h3>
        <p className="text-body-sm mt-1 text-muted-foreground">{content.description}</p>
      </div>
      <Button size="sm" className="rounded-full" asChild>
        <Link href={content.cta.href}>{content.cta.label}</Link>
      </Button>
    </div>
  );
}
