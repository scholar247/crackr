import Link from 'next/link';
import { ArrowRight, Layers, ListChecks, Shuffle, Target, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyPractice } from '@/components/marketing/home/daily-practice';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import type { DailyProblem } from '@/server/repositories/exam-spotlight.repository';
import type { NimcetSubject } from '@/server/services/exam-landing/nimcet';
import { gated, linkCard, plural } from './utils';

interface PracticeModuleProps {
  examSlug: string;
  subjects: NimcetSubject[];
  dailyProblem: DailyProblem | null;
  totalQuestions: number;
  pyqs: number;
  practiceHref: string;
  buildMockHref: string;
  signedIn: boolean;
}

// Three ways to practise — by unit, as a timed chapter test, or mixed — each with the real
// number of questions behind it. Units with no questions yet aren't offered as practice.
export function PracticeModule({ examSlug, subjects, dailyProblem, totalQuestions, pyqs, practiceHref, buildMockHref, signedIn }: PracticeModuleProps) {
  const unitsWithQuestions = subjects.flatMap((s) => s.units.filter((u) => u.practiceHref).map((u) => ({ ...u, subject: s.shortName })));

  const modes = [
    {
      icon: <Layers className="h-5 w-5" />,
      title: 'Topic-wise MCQs',
      description:
        unitsWithQuestions.length > 0
          ? `${plural(unitsWithQuestions.length, 'unit')} with questions ready. Pick one and work through it.`
          : 'Unit-wise question sets are being added. Start with mixed practice meanwhile.',
      href: `${NIMCET_PATH}/practice`,
      cta: 'Choose a unit',
    },
    {
      icon: <Timer className="h-5 w-5" />,
      title: 'Chapter tests',
      description: 'Build a timed test from one unit or several, and get a scored result when you submit.',
      href: gated(buildMockHref, signedIn),
      cta: signedIn ? 'Build a chapter test' : 'Sign in to build a test',
    },
    {
      icon: <Shuffle className="h-5 w-5" />,
      title: 'Mixed practice',
      description:
        totalQuestions > 0 ? `All ${totalQuestions.toLocaleString('en-IN')} NIMCET questions across subjects, like the real paper.` : 'Questions from every subject, like the real paper.',
      href: practiceHref,
      cta: 'Start mixed practice',
    },
  ];

  return (
    <LandingSection id="practice" muted>
      <SectionHeader
        eyebrow="Practice"
        icon={<Target className="h-3.5 w-3.5" />}
        title="Practise NIMCET questions"
        description={
          <>
            Each question shows the correct answer and, where available, a worked solution as soon as you answer.
            {pyqs > 0 && <> Includes {plural(pyqs, 'previous year question')}.</>}
          </>
        }
        action={
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={`${NIMCET_PATH}/practice`}>
              All practice options <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {modes.map((m) => (
          <li key={m.title}>
            <Link href={m.href} className={linkCard}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{m.icon}</span>
              <span className="mt-4 block font-semibold text-foreground">{m.title}</span>
              <span className="text-body-sm mt-1.5 block flex-1 text-muted-foreground">{m.description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {m.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {unitsWithQuestions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground">Units ready to practise</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unitsWithQuestions.map((u) => (
              <li key={u.href}>
                <Link
                  href={u.practiceHref!}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <ListChecks className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {u.name}
                  <span className="text-muted-foreground">· {u.questionCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <DailyPractice examName="NIMCET" examSlug={examSlug} problem={dailyProblem} practiceHref={practiceHref} />
      </div>
    </LandingSection>
  );
}
