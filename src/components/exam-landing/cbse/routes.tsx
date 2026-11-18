import type { ExamLanding, ExamSubpage } from '@/components/exam-landing/registry';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { getCbseLandingData } from '@/server/services/exam-landing/cbse';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { getStreakSummary } from '@/server/services/daily-streak';
import { istDayKey } from '@/lib/ist-date';
import { CbseLanding } from './cbse-landing';
import { CbseSyllabusPage } from './pages/syllabus-page';
import { CbsePaperPatternPage } from './pages/paper-pattern-page';
import { CbsePracticePage } from './pages/practice-page';
import { CbseNotesPage } from './pages/notes-page';
import { CbseMockTestsPage } from './pages/mock-tests-page';
import { samplePaperSubpage } from './pages/sample-papers';
import { mindMapSubpage } from './pages/mind-maps';
import { CBSE_SECTIONS, cbsePath } from './paths';
import { cbseMeta } from './seo';

// Landing + inner pages for one CBSE class. Everything class-specific comes from `board`
// (src/content/exams/cbse/*), so Class 10 and Class 12 share every page and component.
export function cbseLanding(board: CbseBoard): ExamLanding {
  const slug = board.examSlug;
  const { label, session } = board;

  const PAGES: Record<string, ExamSubpage> = {
    syllabus: {
      // Mentions mind maps only once some are actually published for this class.
      metadata: async (exam) => {
        const maps = (await mindMapRepository.listPublishedByExam(exam.id)).length;
        return cbseMeta(
          cbsePath(slug, 'syllabus'),
          maps > 0 ? `${label} Syllabus ${session}: Chapter-wise with Mind Maps` : `${label} Syllabus ${session}: Subject & Chapter-wise`,
          maps > 0
            ? `${label} syllabus ${session}, chapter by chapter with every topic — plus interactive mind maps for ${maps} chapter${maps === 1 ? '' : 's'}, practice MCQs and notes.`
            : `Complete ${label} syllabus ${session}: every subject, chapter and topic, with chapter-wise practice questions and notes.`,
        );
      },
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
      render: async (exam, { userId }) => {
        // The signed-in student's streak, loaded with the page so the calendar renders filled in.
        const [data, streak] = await Promise.all([getCbseLandingData(exam, userId, board), userId ? getStreakSummary(userId, exam.id) : Promise.resolve(null)]);
        return <CbsePracticePage data={data} today={istDayKey()} streak={streak} />;
      },
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
    // Sample papers: hub, session and paper pages. Notifications have no inner pages —
    // they're read on the home page's notification board.
    subpage: (path) => {
      if (path[0] === 'sample-papers') return samplePaperSubpage(board, path.slice(1));
      if (path[0] === 'mind-maps') return mindMapSubpage(board, path.slice(1));
      return path.length === 1 ? (PAGES[path[0]] ?? null) : null;
    },
    // Mind map pages are added to the sitemap only when published (see app/sitemap.ts).
    sitemapPaths: () => [...CBSE_SECTIONS],
  };
}
