import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import type { LandingExam } from '@/server/services/exam-landing/cbse';
import { CBSE_CLASS_10 } from '@/content/exams/cbse/class-10';
import { CBSE_CLASS_12 } from '@/content/exams/cbse/class-12';
import { cbseLanding } from './cbse/routes';
import { NIMCET_LANDING } from './nimcet/routes';

type RenderContext = { userId: string | null };

export interface ExamSubpage {
  /** Static metadata, or computed from the database (e.g. a sample paper's subject and year). */
  metadata: Metadata | ((exam: LandingExam) => Promise<Metadata>);
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
  [CBSE_CLASS_10.examSlug]: cbseLanding(CBSE_CLASS_10),
  [CBSE_CLASS_12.examSlug]: cbseLanding(CBSE_CLASS_12),
  nimcet: NIMCET_LANDING,
};

export function getExamLanding(slug: string): ExamLanding | null {
  return EXAM_LANDINGS[slug] ?? null;
}
