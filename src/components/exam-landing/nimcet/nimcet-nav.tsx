import { ExamNav } from '@/components/exam-landing/shared/exam-page-shell';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';

export const NIMCET_NAV = [
  { key: 'overview', label: 'Overview', href: NIMCET_PATH },
  { key: 'syllabus', label: 'Syllabus', href: `${NIMCET_PATH}/syllabus` },
  { key: 'exam-pattern', label: 'Exam pattern', href: `${NIMCET_PATH}/exam-pattern` },
  { key: 'eligibility', label: 'Eligibility', href: `${NIMCET_PATH}/eligibility` },
  { key: 'practice', label: 'Practice', href: `${NIMCET_PATH}/practice` },
  { key: 'mock-tests', label: 'Mock tests', href: `${NIMCET_PATH}/mock-tests` },
  { key: 'study-plan', label: 'Study plan', href: `${NIMCET_PATH}/study-plan` },
  { key: 'colleges', label: 'Colleges', href: `${NIMCET_PATH}/colleges` },
] as const;

export type NimcetNavKey = (typeof NIMCET_NAV)[number]['key'];

// The NIMCET section menu on every inner page.
export function NimcetNav({ current }: { current?: NimcetNavKey }) {
  return <ExamNav label="NIMCET" items={NIMCET_NAV} current={current} />;
}
