import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getCbseClass10LandingData, type LandingExam } from '@/server/services/exam-landing/cbse-class-10';
import { CbseClass10Landing } from './cbse-class-10/cbse-class-10-landing';
import { NIMCET_LANDING } from './nimcet/routes';

type RenderContext = { userId: string | null };

export interface ExamSubpage {
  metadata: Metadata;
  render: (exam: LandingExam, ctx: RenderContext) => Promise<ReactNode>;
}

export interface ExamLanding {
  metadata: (exam: LandingExam) => Metadata;
  render: (exam: LandingExam, ctx: RenderContext) => Promise<ReactNode>;
  /** Inner pages under /exams/[slug]/…; null for an unknown path (→ 404). */
  subpage?: (path: string[]) => ExamSubpage | null;
  /** Inner page paths (relative to /exams/[slug]) to list in the sitemap. */
  sitemapPaths?: () => string[];
}

// Exam slug → purpose-built landing page. /exams/[slug] renders the entry here when one
// exists and falls back to the generic exam page otherwise — add an exam by adding a key.
export const EXAM_LANDINGS: Record<string, ExamLanding> = {
  'cbse-class-10-board': {
    metadata: () => ({
      title: 'CBSE Class 10 Board Exam Prep: Syllabus, Pattern & PYQs',
      description:
        'Prepare for the CBSE Class 10 board exam: chapter-wise syllabus for Maths, Science, Social Science and English, the latest paper pattern, previous year questions, daily practice and a month-by-month study plan.',
      alternates: { canonical: '/exams/cbse-class-10-board' },
    }),
    render: async (exam, { userId }) => <CbseClass10Landing data={await getCbseClass10LandingData(exam, userId)} />,
  },
  nimcet: NIMCET_LANDING,
};

export function getExamLanding(slug: string): ExamLanding | null {
  return EXAM_LANDINGS[slug] ?? null;
}
