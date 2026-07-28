import type { Metadata } from 'next';
import { ListChecks, Scale, GraduationCap, Shuffle, Monitor, Info } from 'lucide-react';
import {
  ExamHero,
  ExamHighlights,
  ExamSyllabus,
  ExamFaq,
  ExamFinalCta,
} from './shared/exam-landing-sections';

const SLUG = 'cuet';
const PRACTICE_HREF = `/exams/${SLUG}/practice`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CUET UG 2026 Syllabus & Exam Pattern - Free Mocks',
    description:
      'Master CUET UG 2026 with NTA’s exact exam pattern, marking scheme & syllabus. Practice free topic-wise MCQs and mock tests on crackr to boost your score.',
    keywords: [
      'CUET UG 2026 exam pattern', 'CUET UG syllabus pdf download', 'CUET domain subjects list 2026',
      'CUET UG free mock test online', 'CUET previous year question papers pdf', 'CUET general test syllabus topics',
      'CUET UG marking scheme negative marking', 'CUET UG eligibility criteria class 12',
    ],
    alternates: { canonical: `/exams/${SLUG}` },
    openGraph: {
      title: 'CUET UG 2026: Complete Exam Pattern, Syllabus & Free Mock Tests',
      description: 'CUET UG is the single NTA-conducted exam that decides admission into DU, BHU, JNU, JMI and hundreds of universities.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'CUET UG 2026: Complete Exam Pattern, Syllabus & Free Mock Tests',
      description: 'CUET UG is the single NTA-conducted exam that decides admission into DU, BHU, JNU, JMI and hundreds of universities.',
    },
  };
}

const HIGHLIGHTS = [
  {
    icon: ListChecks,
    title: 'All 50 questions are compulsory',
    description: 'Since 2025 the earlier "attempt any 40 of 50" option is gone — every question in every paper counts.',
  },
  {
    icon: Scale,
    title: 'Marking rewards accuracy',
    description: '+5 for correct, −1 for wrong, 0 for unattempted — careless guessing can cost more than skipping.',
  },
  {
    icon: GraduationCap,
    title: 'Eligibility without a cutoff',
    description: 'Passed or appearing in Class 12 from any recognized board, any stream — NTA sets no minimum percentage.',
  },
  {
    icon: Shuffle,
    title: 'Choose any subject, any stream',
    description: 'A Science student can attempt Business Studies, a Commerce student can attempt Physics — no restrictions.',
  },
  {
    icon: Monitor,
    title: 'Fully online, no pen-and-paper option',
    description: 'After a brief 2024 hybrid trial, CUET UG has run entirely as a Computer-Based Test since 2025.',
  },
  {
    icon: Info,
    title: 'General Test is optional, not universal',
    description: 'Required only by select programmes at select universities, like DU’s BBA and BMS — check your target course first.',
  },
];

const SYLLABUS = [
  {
    name: 'Language',
    weight: 'Section I · 13 languages',
    topics: ['Reading Comprehension', 'Vocabulary', 'Verbal Ability & Grammar', 'Para-jumbles', 'Cloze Passages', 'Literary Aptitude & Rhetorical Devices', 'Idioms & Phrasal Usage'],
  },
  {
    name: 'Economics',
    weight: 'Domain Subject',
    topics: ['Consumer Behaviour & Demand', 'Production, Costs & Revenue', 'Market Forms & Price Determination', 'National Income', 'Money, Banking & Financial System', 'Income & Employment', 'Government Budget', 'Balance of Payments'],
  },
  {
    name: 'Accountancy',
    weight: 'Domain Subject',
    topics: ['Partnership Firms — Fundamentals', 'Dissolution of Partnership', 'Share Capital & Debentures', 'Redemption of Debentures', 'Financial Statements of a Company', 'Ratio Analysis', 'Cash Flow Statement', 'Computerised Accounting'],
  },
  {
    name: 'Business Studies',
    weight: 'Domain Subject',
    topics: ['Nature & Significance of Management', 'Principles of Management', 'Planning, Organising & Staffing', 'Directing & Controlling', 'Financial Management', 'Marketing Management', 'Consumer Protection', 'Entrepreneurship Basics'],
  },
  {
    name: 'Physics',
    weight: 'Domain Subject',
    topics: ['Electrostatics & Capacitance', 'Current Electricity', 'Magnetic Effects & Magnetism', 'Electromagnetic Induction & AC', 'Ray & Wave Optics', 'Dual Nature of Radiation & Matter', 'Atoms & Nuclei', 'Semiconductor Electronics'],
  },
  {
    name: 'Political Science',
    weight: 'Domain Subject',
    topics: ['Cold War Era & World Politics', 'India’s Foreign Policy', 'Security in the Contemporary World', 'Nation-Building (post-1947)', 'One-Party Dominance Era', 'Popular Movements & Regional Aspirations', 'Indian Politics (1990s+)', 'The Constitution'],
  },
  {
    name: 'General Test',
    weight: 'Section III · Optional',
    topics: ['General Knowledge & Static GK', 'Current Affairs', 'Quantitative Reasoning', 'Numerical Ability', 'Logical & Analytical Reasoning', 'Data Interpretation', 'General Mental Ability'],
  },
];

const FAQ = [
  {
    question: 'Who is eligible for CUET UG?',
    answer:
      'Any candidate who has passed or is appearing in Class 12 from a recognized board, in any stream, can apply. NTA sets no minimum percentage — individual universities apply their own admission cutoffs separately, only after the exam.',
  },
  {
    question: 'What is the exam pattern for CUET UG?',
    answer:
      'CUET UG has 3 sections — Language, Domain Subjects, and an optional General Test. You can pick up to 5 papers (1 language + 3 domain + General Test), each with 60 minutes and 50 compulsory MCQs worth 250 marks, scored +5/−1.',
  },
  {
    question: 'How should I start preparing for CUET UG?',
    answer:
      'Start with your chosen domain subjects’ NCERT Class 12 textbooks, since most questions are drawn directly from them. Pair that with daily topic-wise MCQ practice and full-length mock tests to build speed and accuracy under the CBT format.',
  },
  {
    question: 'Is CUET UG conducted online or offline?',
    answer:
      'CUET UG is conducted entirely online as a Computer-Based Test (CBT) since 2025, including in 2026 — there is no pen-and-paper option after a brief hybrid trial in 2024.',
  },
  {
    question: 'Is the General Test compulsory for CUET UG?',
    answer:
      'No. It’s optional and only required by specific programmes at select universities, such as DU’s BBA and BMS courses. Check your target university’s admission criteria before including it in your subject combination.',
  },
];

export default function CuetLandingPage() {
  return (
    <>
      <ExamHero
        eyebrow="NTA | Common University Entrance Test (UG) — Gateway to 250+ Central, State & Private Universities"
        title="CUET UG 2026: Complete Exam Pattern, Syllabus & Free Mock Tests"
        description="CUET UG is the single NTA-conducted exam that decides admission into Delhi University, BHU, JNU, Jamia Millia Islamia and hundreds of other universities across India. Practice free, topic-wise MCQs on crackr mapped to the exact NCERT-based syllabus tested in each subject, so nothing on exam day catches you off guard."
        primaryCtaHref={PRACTICE_HREF}
        stats={[
          { label: 'Sections', value: '3' },
          { label: 'Duration', value: '60 min/paper' },
          { label: 'Subjects', value: 'Up to 5' },
          { label: 'Mode', value: '100% CBT' },
        ]}
      />
      <ExamHighlights title="Why practice CUET here" items={HIGHLIGHTS} />
      <ExamSyllabus title="CUET UG syllabus, section by section" groups={SYLLABUS} />
      <ExamFaq title="CUET FAQs" items={FAQ} />

      <ExamFinalCta
        title="Start practicing CUET now"
        description="Free, topic-wise MCQs with instant explanations — no account required."
        ctaLabel="Go to Practice"
        ctaHref={PRACTICE_HREF}
      />

      <ExamFinalCta
        title="Where can your CUET score take you?"
        description="See recent admission trends for DU, BHU, JNU, JMI and more, course by course."
        ctaLabel="Read the full cutoff guide"
        ctaHref="/blogs/cuet-ug-top-universities-cutoffs"
      />

      <ExamFinalCta
        title="Practicing with real exam questions works best"
        description="Read our full CUET UG previous year papers guide and start solving real NTA-pattern questions today."
        ctaLabel="Browse Previous Year Papers"
        ctaHref="/blogs/cuet-ug-previous-year-papers"
      />
    </>
  );
}
