import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getCbseClass10LandingData, type LandingExam } from '@/server/services/exam-landing/cbse-class-10';
import { CbseClass10Landing } from './cbse-class-10/cbse-class-10-landing';

export interface ExamLanding {
  metadata: (exam: LandingExam) => Metadata;
  render: (exam: LandingExam, ctx: { userId: string | null }) => Promise<ReactNode>;
}

// Exam slug → purpose-built landing page. /exams/[slug] renders the entry here when one
// exists and falls back to the generic exam page otherwise — add an exam by adding a key.
export const EXAM_LANDINGS: Record<string, ExamLanding> = {
  'cbse-class-10-board': {
    metadata: () => ({
      title: 'CBSE Class 10 Board Exam Prep: Syllabus, Pattern & PYQs',
      description:
        'Prepare for the CBSE Class 10 board exam: chapter-wise syllabus for Maths, Science, Social Science and English, the latest paper pattern, previous year questions, daily practice and a month-by-month study plan.',
    }),
    render: async (exam, { userId }) => <CbseClass10Landing data={await getCbseClass10LandingData(exam, userId)} />,
  },
};

export function getExamLanding(slug: string): ExamLanding | null {
  return EXAM_LANDINGS[slug] ?? null;
}
