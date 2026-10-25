import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/exam-landing/shared/breadcrumbs';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { NimcetNav, type NimcetNavKey } from './nimcet-nav';

export interface NextStep {
  label: string;
  description: string;
  href: string;
}

// Frame for every NIMCET inner page: section menu, breadcrumbs, the page's single H1 and
// intro, the body, then "where to go next" links so no page is a dead end.
export function NimcetPageShell({
  nav,
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  nextSteps,
  children,
}: {
  nav?: NimcetNavKey;
  /** Crumbs after Home › Exams › NIMCET. */
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  aside?: ReactNode;
  nextSteps: NextStep[];
  children: ReactNode;
}) {
  return (
    <main>
      <NimcetNav current={nav} />
      <header className="bg-background">
        <div className="mx-auto max-w-page px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Exams', href: '/exams' }, { label: 'NIMCET', href: NIMCET_PATH }, ...crumbs]} />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow && <p className="text-label-caps uppercase tracking-wider text-primary">{eyebrow}</p>}
              <h1 className="text-headline-xl mt-1 text-foreground max-sm:text-[2rem] max-sm:leading-10">{title}</h1>
              <div className="text-body-lg mt-3 text-muted-foreground">{intro}</div>
            </div>
            {aside}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-page space-y-12 px-4 pb-14 sm:px-6 lg:px-8">{children}</div>

      <section aria-labelledby="next-steps" className="border-t border-border bg-surface-container-lowest">
        <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
          <h2 id="next-steps" className="text-headline-md text-foreground">
            Continue your NIMCET preparation
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nextSteps.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="group flex h-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span>
                    <span className="block font-semibold text-foreground">{s.label}</span>
                    <span className="text-body-sm mt-1 block text-muted-foreground">{s.description}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

/** A titled block inside an inner page. */
export function PageSection({ id, title, description, action, children }: { id?: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={headingId} className="text-headline-md text-foreground">
            {title}
          </h2>
          {description && <div className="text-body-md mt-1.5 text-muted-foreground">{description}</div>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export const STEP = {
  syllabus: { label: 'Full syllabus', description: 'Every official topic, by subject and unit', href: `${NIMCET_PATH}/syllabus` },
  pattern: { label: 'Exam pattern', description: 'Parts, timing, marking and ranking rules', href: `${NIMCET_PATH}/exam-pattern` },
  eligibility: { label: 'Eligibility', description: 'Degree, marks and documents needed', href: `${NIMCET_PATH}/eligibility` },
  strategy: { label: 'Preparation strategy', description: 'How to split your time across subjects', href: `${NIMCET_PATH}/preparation-strategy` },
  studyPlan: { label: 'Study plan', description: '30, 60 and 90-day schedules', href: `${NIMCET_PATH}/study-plan` },
  practice: { label: 'Practice questions', description: 'Subject and unit-wise MCQs with solutions', href: `${NIMCET_PATH}/practice` },
  mocks: { label: 'Mock tests', description: 'Timed tests and your score history', href: `${NIMCET_PATH}/mock-tests` },
  colleges: { label: 'Participating colleges', description: 'NITs and IIITs, seats and fees', href: `${NIMCET_PATH}/colleges` },
  counselling: { label: 'Admission & counselling', description: 'Rounds, fees and seat acceptance', href: `${NIMCET_PATH}/admission-counselling` },
  overview: { label: 'NIMCET overview', description: 'Back to the NIMCET preparation hub', href: NIMCET_PATH },
} satisfies Record<string, NextStep>;
