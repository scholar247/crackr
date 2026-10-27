import Link from 'next/link';
import { ArrowRight, Compass, Route, Target, TrendingUp } from 'lucide-react';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { gated } from './utils';

// One entry point per kind of student, each leading to a page that serves that need.
export function PrepPaths({ signedIn, questionCount }: { signedIn: boolean; questionCount: number }) {
  const paths = [
    {
      icon: <Compass className="h-5 w-5" />,
      title: 'I am starting my preparation',
      description: 'Check eligibility, understand the pattern, then follow a step-by-step plan for the whole syllabus.',
      primary: { label: 'See how to prepare', href: `${NIMCET_PATH}/preparation-strategy` },
      secondary: [
        { label: 'Eligibility', href: `${NIMCET_PATH}/eligibility` },
        { label: 'Study plans', href: `${NIMCET_PATH}/study-plan` },
      ],
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: 'I want to practise questions',
      description:
        questionCount > 0
          ? `Practise by subject or unit from ${questionCount.toLocaleString('en-IN')} published NIMCET questions, with solutions after each answer.`
          : 'Practise by subject or unit, with solutions after each answer.',
      primary: { label: 'Go to practice', href: `${NIMCET_PATH}/practice` },
      secondary: [{ label: 'Browse the syllabus', href: `${NIMCET_PATH}/syllabus` }],
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'I want to improve my mock scores',
      description: 'Take timed mocks built on the official three-part pattern, then use your score history to find weak subjects.',
      primary: { label: 'Mock tests', href: `${NIMCET_PATH}/mock-tests` },
      secondary: [{ label: signedIn ? 'Your progress' : 'Sign in to track progress', href: gated('/progress', signedIn) }],
    },
  ];

  return (
    <LandingSection id="paths" muted>
      <SectionHeader eyebrow="Where to start" icon={<Route className="h-3.5 w-3.5" />} title="Choose your preparation path" />
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {paths.map((p) => (
          <li key={p.title} className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{p.icon}</span>
            <h3 className="text-body-lg mt-4 font-semibold text-foreground">{p.title}</h3>
            <p className="text-body-sm mt-2 flex-1 text-muted-foreground">{p.description}</p>
            <Link
              href={p.primary.href}
              className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {p.primary.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {p.secondary.map((s) => (
                <Link key={s.href} href={s.href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {s.label}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
