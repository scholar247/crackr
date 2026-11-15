import { samplePapersPath } from '@/lib/sample-papers';
import { noticeHref } from '@/lib/notifications';
import { mindMapsPath } from '@/lib/mind-maps';
import type { ExamNavItem, NextStep } from '@/components/exam-landing/shared/exam-page-shell';
import type { CbseBoard } from '@/content/exams/cbse/types';

// URL map for a CBSE board landing. Inner pages are resolved by ./routes.tsx under
// /exams/{slug}/… (sample papers and mind maps resolve their own deeper paths there);
// notifications live on the home page.

export const CBSE_SECTIONS = ['syllabus', 'paper-pattern', 'practice', 'notes', 'mock-tests'] as const;
export type CbseSection = (typeof CBSE_SECTIONS)[number];

export function cbsePath(examSlug: string, section?: CbseSection | 'notifications' | 'sample-papers' | 'mind-maps'): string {
  // Notifications live in the board at the top of the exam home page.
  if (section === 'notifications') return noticeHref(examSlug);
  if (section === 'sample-papers') return samplePapersPath(examSlug);
  if (section === 'mind-maps') return mindMapsPath(examSlug);
  return `/exams/${examSlug}${section ? `/${section}` : ''}`;
}

export type CbseNavKey = 'overview' | CbseSection | 'sample-papers' | 'mind-maps';

export function cbseNavItems(examSlug: string): (ExamNavItem & { key: CbseNavKey })[] {
  return [
    { key: 'overview', label: 'Overview', href: cbsePath(examSlug) },
    { key: 'syllabus', label: 'Syllabus', href: cbsePath(examSlug, 'syllabus') },
    { key: 'notes', label: 'Notes', href: cbsePath(examSlug, 'notes') },
    { key: 'mind-maps', label: 'Mind maps', href: cbsePath(examSlug, 'mind-maps') },
    { key: 'practice', label: 'Practice MCQs', href: cbsePath(examSlug, 'practice') },
    { key: 'sample-papers', label: 'Sample papers', href: cbsePath(examSlug, 'sample-papers') },
    { key: 'mock-tests', label: 'Mock tests', href: cbsePath(examSlug, 'mock-tests') },
    { key: 'paper-pattern', label: 'Paper pattern', href: cbsePath(examSlug, 'paper-pattern') },
  ];
}

/** "Continue your preparation" links — descriptive anchors for internal linking. */
export function cbseSteps(board: CbseBoard): Record<CbseNavKey, NextStep> {
  const slug = board.examSlug;
  const c = board.shortLabel;
  return {
    overview: { label: `${board.label} overview`, description: `Back to the ${c} preparation hub`, href: cbsePath(slug) },
    syllabus: { label: `${c} syllabus`, description: 'Every subject and chapter, with topics', href: cbsePath(slug, 'syllabus') },
    notes: { label: `${c} notes`, description: 'Chapter notes and revision guides', href: cbsePath(slug, 'notes') },
    'mind-maps': { label: `${c} mind maps`, description: 'Chapter-wise interactive mind maps for revision', href: cbsePath(slug, 'mind-maps') },
    practice: { label: `${c} practice MCQs`, description: 'Subject and chapter-wise questions with solutions', href: cbsePath(slug, 'practice') },
    'sample-papers': { label: `${c} sample papers`, description: 'Official papers with marking schemes', href: cbsePath(slug, 'sample-papers') },
    'mock-tests': { label: `${c} mock tests`, description: 'Timed board-style tests and your scores', href: cbsePath(slug, 'mock-tests') },
    'paper-pattern': { label: `${c} paper pattern`, description: 'Sections, marks and question types by subject', href: cbsePath(slug, 'paper-pattern') },
  };
}
