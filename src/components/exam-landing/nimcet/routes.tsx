import type { Metadata } from 'next';
import type { ExamLanding, ExamSubpage } from '@/components/exam-landing/registry';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { PATTERN } from '@/content/exams/nimcet/official';
import { SYLLABUS, findSubject, findUnit } from '@/content/exams/nimcet/syllabus';
import { getNimcetData } from '@/server/services/exam-landing/nimcet';
import { NimcetLanding } from './nimcet-landing';
import { NimcetExamPatternPage } from './pages/exam-pattern-page';
import { NimcetEligibilityPage } from './pages/eligibility-page';
import { NimcetSyllabusPage } from './pages/syllabus-page';
import { NimcetSubjectPage } from './pages/subject-page';
import { NimcetUnitPage } from './pages/unit-page';
import { NimcetStrategyPage } from './pages/strategy-page';
import { NimcetStudyPlanPage } from './pages/study-plan-page';
import { NimcetPracticePage } from './pages/practice-page';
import { NimcetMockTestsPage } from './pages/mock-tests-page';
import { NimcetCollegesPage } from './pages/colleges-page';
import { NimcetCounsellingPage } from './pages/counselling-page';

function meta(path: string, title: string, description: string): Metadata {
  const url = `${NIMCET_PATH}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
  };
}

// Single-segment inner pages. Subject and unit pages are resolved from the syllabus below,
// so adding a unit to content/exams/nimcet/syllabus.ts adds its page (and sitemap entry).
const PAGES: Record<string, ExamSubpage> = {
  'exam-pattern': {
    metadata: meta('/exam-pattern', `NIMCET Exam Pattern ${PATTERN.year}: Marking Scheme & Timing`, `NIMCET ${PATTERN.year} pattern: 120 MCQs in three timed parts, 1000 marks, subject-wise marking and negative marking, qualifying rules and tie-breakers.`),
    render: async () => <NimcetExamPatternPage />,
  },
  eligibility: {
    metadata: meta('/eligibility', 'NIMCET Eligibility Criteria: Degree, Marks & Documents', 'Who can apply for NIMCET: qualifying degree with Mathematics or Statistics, minimum 60% (55% for SC/ST/PwD), final-year candidates, documents and application fee.'),
    render: async () => <NimcetEligibilityPage />,
  },
  syllabus: {
    metadata: meta('/syllabus', 'NIMCET Syllabus 2026: Subject & Unit-wise Topics', 'The complete official NIMCET syllabus (2026 onwards) for Mathematics, Logical Reasoning, Computer Awareness and English, unit by unit, with practice links.'),
    render: async (exam, { userId }) => <NimcetSyllabusPage data={await getNimcetData(exam, userId)} />,
  },
  'preparation-strategy': {
    metadata: meta('/preparation-strategy', 'How to Prepare for NIMCET: Subject-wise Strategy', 'A practical NIMCET preparation strategy based on how the exam is marked and timed: where the marks are, four phases of preparation, and what to do next.'),
    render: async () => <NimcetStrategyPage />,
  },
  'study-plan': {
    metadata: meta('/study-plan', 'NIMCET Study Plan: 30, 60 and 90-Day Schedules', 'Ready-made 30, 60 and 90-day NIMCET study plans with daily and weekly goals, each task linked to the unit to study.'),
    render: async (_exam, { userId }) => <NimcetStudyPlanPage signedIn={!!userId} />,
  },
  practice: {
    metadata: meta('/practice', 'NIMCET Practice Questions: Subject & Unit-wise MCQs', 'Practise NIMCET MCQs by subject and unit with answers and solutions, try mixed sets, or build a timed chapter test.'),
    render: async (exam, { userId }) => <NimcetPracticePage data={await getNimcetData(exam, userId)} />,
  },
  'mock-tests': {
    metadata: meta('/mock-tests', 'NIMCET Mock Tests: Timed Practice Tests', 'Take timed NIMCET mock tests, build your own on the official pattern, and track your scores over time.'),
    render: async (exam, { userId }) => <NimcetMockTestsPage data={await getNimcetData(exam, userId)} />,
  },
  colleges: {
    metadata: meta('/colleges', 'NIMCET Colleges 2026: NITs, IIITs, Seats & Fees', 'The NITs and IIITs that admit MCA students through NIMCET, with 2026 seat counts and semester fees from the official brochure.'),
    render: async () => <NimcetCollegesPage />,
  },
  'admission-counselling': {
    metadata: meta('/admission-counselling', 'NIMCET Counselling: Admission Process, Rounds & Fees', 'How NIMCET counselling works: registration and choice filling, seat allotment rounds, freeze/float/withdraw, fees, and the 2026 schedule.'),
    render: async () => <NimcetCounsellingPage />,
  },
};

function resolveSubpage(path: string[]): ExamSubpage | null {
  if (path.length === 1 && PAGES[path[0]]) return PAGES[path[0]];

  if (path.length === 1) {
    const subject = findSubject(path[0]);
    if (!subject) return null;
    return {
      metadata: meta(`/${subject.slug}`, `NIMCET ${subject.name}: Syllabus, Units & Practice`, `NIMCET ${subject.name}: ${subject.questions} questions in Part ${subject.part}. Official units and topics, how to prepare, and unit-wise practice.`),
      render: async (exam, { userId }) => {
        const data = await getNimcetData(exam, userId);
        return <NimcetSubjectPage data={data} subject={data.subjects.find((s) => s.slug === subject.slug)!} />;
      },
    };
  }

  if (path.length === 2) {
    const found = findUnit(path[0], path[1]);
    if (!found) return null;
    const { subject, unit } = found;
    return {
      metadata: meta(`/${subject.slug}/${unit.slug}`, `${unit.name} for NIMCET ${subject.shortName}: Topics & Practice`, `${unit.name} in the NIMCET ${subject.name} syllabus: ${unit.topics.slice(0, 4).join(', ')} and more, with tips and practice questions.`),
      render: async (exam, { userId }) => {
        const data = await getNimcetData(exam, userId);
        const s = data.subjects.find((x) => x.slug === subject.slug)!;
        return <NimcetUnitPage data={data} subject={s} unit={s.units.find((u) => u.slug === unit.slug)!} />;
      },
    };
  }

  return null;
}

export const NIMCET_LANDING: ExamLanding = {
  metadata: () =>
    meta(
      '',
      'NIMCET Preparation: Syllabus, Pattern, Practice & Mock Tests',
      'Prepare for NIMCET with the official syllabus unit by unit, the exam pattern and eligibility, practice MCQs with solutions, timed mock tests, study plans and the list of participating NITs and IIITs.',
    ),
  render: async (exam, { userId }) => <NimcetLanding data={await getNimcetData(exam, userId)} />,
  subpage: resolveSubpage,
  sitemapPaths: () => [
    ...Object.keys(PAGES),
    ...SYLLABUS.flatMap((s) => [s.slug, ...s.units.map((u) => `${s.slug}/${u.slug}`)]),
  ],
};
