import Link from 'next/link';
import { ArrowRight, LineChart, LogIn, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyPractice } from '@/components/marketing/home/daily-practice';
import { ProgressStatCard } from '@/components/progress/progress-stat-card';
import { progressColorFor } from '@/components/progress/progress-chart-colors';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { DailyProblem } from '@/server/repositories/exam-spotlight.repository';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import type { LandingSubject } from '@/server/services/exam-landing/cbse-class-10';

interface PracticeSectionProps {
  exam: { name: string; slug: string };
  dailyProblem: DailyProblem | null;
  subjects: LandingSubject[];
  practiceHref: string;
  totalQuestions: number;
  signedIn: boolean;
  progress: ProgressGroup | null;
}

export function PracticeSection({ exam, dailyProblem, subjects, practiceHref, totalQuestions, signedIn, progress }: PracticeSectionProps) {
  const rowClass = 'flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3';
  const linkRowClass = `group ${rowClass} transition-colors hover:border-primary/40 hover:bg-primary/5`;
  const arrow = (
    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
  );

  return (
    <LandingSection id="practice">
      <SectionHeader
        eyebrow="Practice"
        icon={<Target className="h-3.5 w-3.5" />}
        title="Practise every day"
        description="One question a day keeps you in touch with every subject. Then go deeper, one subject at a time."
      />

      <div className="mt-8">
        <DailyPractice examName="Class 10" examSlug={exam.slug} problem={dailyProblem} practiceHref={practiceHref} />
      </div>

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

        <ProgressPanel examSlug={exam.slug} signedIn={signedIn} progress={progress} />
      </div>
    </LandingSection>
  );
}

// Real progress only (from mock attempts) — a nudge to sign in or take a first mock otherwise,
// never placeholder numbers.
function ProgressPanel({ examSlug, signedIn, progress }: { examSlug: string; signedIn: boolean; progress: ProgressGroup | null }) {
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
        description: 'Take your first Class 10 mock and your scores, best result and trend appear here.',
        cta: { href: '/mocks/new/self', label: 'Build a mock' },
      }
    : {
        icon: <LogIn className="h-5 w-5" />,
        title: 'Track your progress',
        description: 'Sign in to save your answers and see your scores and trends across mocks.',
        cta: { href: `/sign-in?callbackUrl=${encodeURIComponent(`/exams/${examSlug}`)}`, label: 'Sign in' },
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
