import Link from 'next/link';
import { ArrowRight, LineChart, ListChecks, LogIn, Shuffle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyChallenge } from './daily-challenge';
import { ProgressStatCard } from '@/components/progress/progress-stat-card';
import { progressColorFor } from '@/components/progress/progress-chart-colors';
import type { DailyProblem } from '@/server/repositories/exam-spotlight.repository';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import type { StreakSummary } from '@/server/services/daily-streak';

interface PracticeSectionProps {
  exam: { name: string; slug: string };
  /** "Class 10" — used in copy. */
  classLabel: string;
  dailyProblem: DailyProblem | null;
  practiceHref: string;
  mockTestsHref: string;
  signedIn: boolean;
  progress: ProgressGroup | null;
  /** Server's IST day key and the signed-in student's streak (null for guests). */
  today: string;
  streak: StreakSummary | null;
}

// Question of the day at full width, then streak · progress · next steps in one row, so
// answering today's question leads straight into more practice.
export function PracticeSection({ exam, classLabel, dailyProblem, practiceHref, mockTestsHref, signedIn, progress, today, streak }: PracticeSectionProps) {
  return (
    <DailyChallenge
      examSlug={exam.slug}
      classLabel={classLabel}
      problem={dailyProblem}
      practiceHref={practiceHref}
      signedIn={signedIn}
      signInHref={`/sign-in?callbackUrl=${encodeURIComponent(`/exams/${exam.slug}/practice`)}`}
      today={today}
      initialSummary={streak}
    >
      <ProgressPanel examSlug={exam.slug} classLabel={classLabel} signedIn={signedIn} progress={progress} />
      <KeepGoing classLabel={classLabel} practiceHref={practiceHref} mockTestsHref={mockTestsHref} />
    </DailyChallenge>
  );
}

function KeepGoing({ classLabel, practiceHref, mockTestsHref }: { classLabel: string; practiceHref: string; mockTestsHref: string }) {
  const items = [
    { href: '#find', icon: <ListChecks className="h-4 w-4" />, title: 'Practise by chapter & topic', description: 'Pick exactly what you are revising' },
    { href: practiceHref, icon: <Shuffle className="h-4 w-4" />, title: `Mixed ${classLabel} MCQs`, description: 'Every subject, with solutions' },
    { href: mockTestsHref, icon: <Timer className="h-4 w-4" />, title: 'Take a timed mock', description: 'Test yourself under exam conditions' },
  ];
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold text-foreground">Keep going</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i.title}>
            <Link href={i.href} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-primary/5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{i.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground group-hover:text-primary">{i.title}</span>
                <span className="block text-xs text-muted-foreground">{i.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
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
