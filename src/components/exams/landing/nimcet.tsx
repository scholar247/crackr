import type { Metadata } from 'next';
import { Calculator, Brain, Cpu, Trophy, Clock, Users } from 'lucide-react';
import {
  ExamHero,
  ExamHighlights,
  ExamSyllabus,
  ExamFaq,
  ExamFinalCta,
} from './shared/exam-landing-sections';

const SLUG = 'nimcet';
const PRACTICE_HREF = `/exams/${SLUG}/practice`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'NIMCET Preparation — Free MCQ Practice, Syllabus & Mock Tests',
    description:
      'Prepare for NIMCET with topic-wise MCQs covering Mathematics, Analytical Reasoning, Computer Awareness, and English. Free, no sign-up required.',
    keywords: [
      'NIMCET', 'NIMCET preparation', 'NIMCET MCQ', 'NIMCET syllabus', 'NIMCET mock test',
      'NIT MCA entrance exam', 'NIMCET practice questions',
    ],
    alternates: { canonical: `/exams/${SLUG}` },
    openGraph: {
      title: 'NIMCET Preparation — Free MCQ Practice & Mock Tests',
      description: 'Topic-wise NIMCET MCQs across Maths, Reasoning, Computer Awareness and English.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'NIMCET Preparation — Free MCQ Practice & Mock Tests',
      description: 'Topic-wise NIMCET MCQs across Maths, Reasoning, Computer Awareness and English.',
    },
  };
}

const HIGHLIGHTS = [
  {
    icon: Calculator,
    title: 'Maths-heavy question bank',
    description: 'NIMCET is ~50% Mathematics — practice the highest-weight topics first.',
  },
  {
    icon: Brain,
    title: 'Analytical reasoning drills',
    description: 'Timed sets for logical reasoning and analytical ability, the second-largest section.',
  },
  {
    icon: Cpu,
    title: 'Computer awareness coverage',
    description: 'Fundamentals across digital logic, OS, DBMS, and networking — no prior CS degree assumed.',
  },
  {
    icon: Clock,
    title: 'Built for the 120-minute format',
    description: 'Practice sets mirror NIMCET’s single-sitting, negative-marking structure.',
  },
  {
    icon: Trophy,
    title: 'Full-syllabus mock tests',
    description: 'Simulate exam-day pressure with scored mocks and instant explanations.',
  },
  {
    icon: Users,
    title: 'No login required',
    description: 'Start practicing immediately — create an account only if you want to save progress.',
  },
];

const SYLLABUS = [
  {
    name: 'Mathematics',
    weight: '~50%',
    topics: ['Set Theory', 'Algebra', 'Coordinate Geometry', 'Calculus', 'Trigonometry', 'Vectors', 'Probability', 'Statistics'],
  },
  {
    name: 'Analytical Ability & Logical Reasoning',
    weight: '~40 Qs',
    topics: ['Puzzles', 'Series', 'Blood Relations', 'Coding-Decoding', 'Data Sufficiency', 'Venn Diagrams'],
  },
  {
    name: 'Computer Awareness',
    weight: '~20 Qs',
    topics: ['Computer Basics', 'Data Representation', 'Digital Logic', 'Operating Systems', 'DBMS', 'Networking'],
  },
  {
    name: 'General English',
    weight: '~20 Qs',
    topics: ['Vocabulary', 'Comprehension', 'Grammar', 'Synonyms & Antonyms'],
  },
];

const FAQ = [
  {
    question: 'What is NIMCET and who conducts it?',
    answer:
      'NIMCET (NIT MCA Common Entrance Test) is the national-level entrance exam for admission to the MCA programme at NITs. It is conducted on a rotational basis by one of the participating NITs.',
  },
  {
    question: 'What is the NIMCET exam pattern?',
    answer:
      'NIMCET is a 120-minute computer-based test with 120 objective questions across Mathematics, Analytical Ability & Logical Reasoning, Computer Awareness, and General English, with negative marking for wrong answers.',
  },
  {
    question: 'Is this NIMCET practice platform free?',
    answer:
      'Yes. All topic-wise MCQ practice is free and does not require sign-up. Creating a free account lets you save progress and access mock tests.',
  },
  {
    question: 'How should I start preparing for NIMCET?',
    answer:
      'Start with Mathematics since it carries the highest weight, then build speed on Analytical Reasoning. Use topic-wise practice to find weak areas before moving to full-length mock tests.',
  },
];

export default function NimcetLandingPage() {
  return (
    <>
      <ExamHero
        eyebrow="NIT MCA Common Entrance Test"
        title="Crack NIMCET with structured, topic-wise MCQ practice"
        description="Practice thousands of NIMCET-pattern questions across Mathematics, Analytical Reasoning, Computer Awareness, and English — free, no sign-up needed to get started."
        primaryCtaHref={PRACTICE_HREF}
        stats={[
          { label: 'Sections covered', value: '4' },
          { label: 'Exam duration', value: '120 min' },
          { label: 'Total questions', value: '120' },
          { label: 'Sign-up needed', value: 'No' },
        ]}
      />
      <ExamHighlights title="Why practice NIMCET here" items={HIGHLIGHTS} />
      <ExamSyllabus title="NIMCET syllabus, section by section" groups={SYLLABUS} />
      <ExamFaq title="NIMCET FAQs" items={FAQ} />

      <ExamFinalCta
        title="Start practicing NIMCET now"
        description="Free, topic-wise MCQs with instant explanations — no account required."
        ctaLabel="Go to Practice"
        ctaHref={PRACTICE_HREF}
      />

      <ExamFinalCta
        title="Ready to test yourself under real exam conditions?"
        description="Take a full-length NIMCET mock test with negative marking and instant scoring."
        ctaLabel="Browse Previous Year Papers"
        ctaHref={`/pyp/${SLUG}`}
      />
    </>
  );
}
