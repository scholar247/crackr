import type { ReactNode } from 'react';
import type { Crumb } from '@/components/exam-landing/shared/breadcrumbs';
import { ExamPageShell, type NextStep } from '@/components/exam-landing/shared/exam-page-shell';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { NimcetNav, type NimcetNavKey } from './nimcet-nav';

export { PageSection, type NextStep } from '@/components/exam-landing/shared/exam-page-shell';

// Frame for every NIMCET inner page: the shared exam page shell with the NIMCET menu and
// the Home › Exams › NIMCET trail.
export function NimcetPageShell({
  nav,
  crumbs,
  nextSteps,
  ...rest
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
    <ExamPageShell
      {...rest}
      nav={<NimcetNav current={nav} />}
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Exams', href: '/exams' }, { label: 'NIMCET', href: NIMCET_PATH }, ...crumbs]}
      nextStepsTitle="Continue your NIMCET preparation"
      nextSteps={nextSteps}
    />
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
