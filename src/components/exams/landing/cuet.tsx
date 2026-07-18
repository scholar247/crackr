import type { Metadata } from 'next';
import { Languages, BookOpen, Brain, GraduationCap, Clock, Trophy } from 'lucide-react';
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
    title: 'CUET Preparation — Free MCQ Practice for Language, Domain & General Test',
    description:
      'Practice CUET MCQs across Language, Domain Subjects, and the General Test. Topic-wise questions with instant explanations, free and no sign-up required.',
    keywords: [
      'CUET', 'CUET preparation', 'CUET MCQ', 'CUET syllabus', 'CUET mock test',
      'Common University Entrance Test', 'CUET domain subjects',
    ],
    alternates: { canonical: `/exams/${SLUG}` },
    openGraph: {
      title: 'CUET Preparation — Free MCQ Practice',
      description: 'Topic-wise CUET MCQs across Language, Domain Subjects, and the General Test.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'CUET Preparation — Free MCQ Practice',
      description: 'Topic-wise CUET MCQs across Language, Domain Subjects, and the General Test.',
    },
  };
}

const HIGHLIGHTS = [
  {
    icon: Languages,
    title: 'Language section drills',
    description: 'Reading comprehension, vocabulary, and grammar practice tuned to CUET’s format.',
  },
  {
    icon: BookOpen,
    title: 'Domain subject coverage',
    description: 'Topic-wise MCQs across the domain subjects most CUET applicants choose.',
  },
  {
    icon: Brain,
    title: 'General Test practice',
    description: 'General knowledge, current affairs, reasoning, and numerical ability in one place.',
  },
  {
    icon: Clock,
    title: 'Section-timed practice sets',
    description: 'Practice under the same time pressure as the actual CUET slots.',
  },
  {
    icon: Trophy,
    title: 'Full mock tests',
    description: 'Combine sections into scored mocks that mirror the real exam experience.',
  },
  {
    icon: GraduationCap,
    title: 'Built for university admissions',
    description: 'Aligned to what central and participating universities actually test for.',
  },
];

const SYLLABUS = [
  {
    name: 'Language',
    weight: 'Section IA/IB',
    topics: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Literary & Factual Passages'],
  },
  {
    name: 'Domain Subjects',
    weight: 'Section II',
    topics: ['Accountancy', 'Business Studies', 'Economics', 'Physics', 'Chemistry', 'Mathematics', 'Political Science'],
  },
  {
    name: 'General Test',
    weight: 'Section III',
    topics: ['General Knowledge', 'Current Affairs', 'General Mental Ability', 'Numerical Ability', 'Logical Reasoning'],
  },
];

const FAQ = [
  {
    question: 'What is CUET?',
    answer:
      'CUET (Common University Entrance Test) is a national-level exam for undergraduate admissions to central and several participating universities in India, covering Language, Domain Subjects, and a General Test.',
  },
  {
    question: 'Do I need to prepare for all CUET sections?',
    answer:
      'No — most universities require specific combinations of Language and Domain Subject papers based on the course you’re applying to, plus the General Test where applicable. Check your target university’s requirements.',
  },
  {
    question: 'Is CUET practice on this platform free?',
    answer:
      'Yes. Topic-wise MCQ practice across Language, Domain Subjects, and the General Test is free with no sign-up required.',
  },
  {
    question: 'How is CUET scored?',
    answer:
      'CUET typically awards marks for correct answers with negative marking for incorrect ones — practicing under timed, negative-marking conditions helps build accuracy.',
  },
];

export default function CuetLandingPage() {
  return (
    <>
      <ExamHero
        eyebrow="Common University Entrance Test"
        title="Prepare for CUET with free, topic-wise MCQ practice"
        description="Cover Language, Domain Subjects, and the General Test with structured practice sets and instant explanations — no sign-up needed to get started."
        primaryCtaHref={PRACTICE_HREF}
        stats={[
          { label: 'Sections', value: '3' },
          { label: 'Domain subjects', value: '7+' },
          { label: 'Negative marking', value: 'Yes' },
          { label: 'Sign-up needed', value: 'No' },
        ]}
      />
      <ExamHighlights title="Why practice CUET here" items={HIGHLIGHTS} />
      <ExamSyllabus title="CUET syllabus, section by section" groups={SYLLABUS} />
      <ExamFaq title="CUET FAQs" items={FAQ} />

      <ExamFinalCta
        title="Start practicing CUET now"
        description="Free, topic-wise MCQs with instant explanations — no account required."
        ctaLabel="Go to Practice"
        ctaHref={PRACTICE_HREF}
      />

      <ExamFinalCta
        title="Want to test yourself under real exam conditions?"
        description="Take a full-length CUET mock test with negative marking and instant scoring."
        ctaLabel="Browse Previous Year Papers"
        ctaHref={`/pyp/${SLUG}`}
      />
    </>
  );
}
