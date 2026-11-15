import type { ExamLanding, ExamSubpage } from '@/components/exam-landing/registry';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { getCbseLandingData } from '@/server/services/exam-landing/cbse';
import { CbseLanding } from './cbse-landing';
import { CbseSyllabusPage } from './pages/syllabus-page';
import { CbsePaperPatternPage } from './pages/paper-pattern-page';
import { CbsePracticePage } from './pages/practice-page';
import { CbseNotesPage } from './pages/notes-page';
import { CbseMockTestsPage } from './pages/mock-tests-page';
import { CBSE_SECTIONS, cbsePath } from './paths';
import { cbseMeta } from './seo';

// Landing + inner pages for one CBSE class. Everything class-specific comes from `board`
// (src/content/exams/cbse/*), so Class 10 and Class 12 share every page and component.
export function cbseLanding(board: CbseBoard): ExamLanding {
  const slug = board.examSlug;
  const { label, session } = board;

  const PAGES: Record<string, ExamSubpage> = {
    syllabus: {
      metadata: cbseMeta(
        cbsePath(slug, 'syllabus'),
        `${label} Syllabus ${session}: Subject & Chapter-wise`,
        `Complete ${label} syllabus for ${session}: every chapter and topic in ${board.coreSubjects}, with chapter-wise practice questions and notes.`,
      ),
      render: async (exam, { userId }) => <CbseSyllabusPage data={await getCbseLandingData(exam, userId, board)} />,
    },
    'paper-pattern': {
      metadata: cbseMeta(
        cbsePath(slug, 'paper-pattern'),
        `${label} Paper Pattern ${session}: Marks & Sections`,
        `${label} exam pattern for ${session}: theory and internal marks, section-wise question types, marks per section and passing rules for each subject.`,
      ),
      render: async (exam, { userId }) => <CbsePaperPatternPage data={await getCbseLandingData(exam, userId, board)} />,
    },
    practice: {
      metadata: cbseMeta(
        cbsePath(slug, 'practice'),
        `${label} MCQs: Chapter-wise Practice with Solutions`,
        `Practise ${label} MCQs subject by subject and chapter by chapter, including previous year questions, each with a worked solution. Plus a new question every day.`,
      ),
      render: async (exam, { userId }) => <CbsePracticePage data={await getCbseLandingData(exam, userId, board)} />,
    },
    notes: {
      metadata: cbseMeta(
        cbsePath(slug, 'notes'),
        `${label} Notes: Chapter-wise Revision Notes`,
        `${label} notes for every subject: chapter-wise explanations, solved examples and quick revision guides mapped to the CBSE ${session} syllabus.`,
      ),
      render: async (exam, { userId }) => <CbseNotesPage data={await getCbseLandingData(exam, userId, board)} />,
    },
    'mock-tests': {
      metadata: cbseMeta(
        cbsePath(slug, 'mock-tests'),
        `${label} Mock Tests: Timed Board-Style Practice`,
        `Take timed ${label} mock tests on the board pattern, build your own from chosen chapters, and track your scores — with tips to get the most from every mock.`,
      ),
      render: async (exam, { userId }) => <CbseMockTestsPage data={await getCbseLandingData(exam, userId, board)} />,
    },
  };

  return {
    metadata: () =>
      cbseMeta(
        cbsePath(slug),
        `${label} Board Exam ${session}: Syllabus, Papers & MCQs`,
        `Prepare for the ${label} board exam ${session} with the chapter-wise syllabus, paper pattern, MCQs, notes, mock tests, sample papers and CBSE notifications.`,
      ),
    render: async (exam, { userId }) => <CbseLanding data={await getCbseLandingData(exam, userId, board)} />,
    // Notifications have no inner pages: they're read on the home page's notification board.
    subpage: (path) => (path.length === 1 ? (PAGES[path[0]] ?? null) : null),
    sitemapPaths: () => [...CBSE_SECTIONS],
  };
}
