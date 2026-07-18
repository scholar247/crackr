import type { Metadata } from 'next';
import { Network, Database, Cpu, Binary, GitBranch, Trophy } from 'lucide-react';
import {
  ExamHero,
  ExamHighlights,
  ExamSyllabus,
  ExamFaq,
  ExamFinalCta,
} from './shared/exam-landing-sections';

const SLUG = 'gate-cse';
const PRACTICE_HREF = `/exams/${SLUG}/practice`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'GATE CSE Preparation — Free MCQ Practice & Topic-Wise Tests',
    description:
      'Practice GATE Computer Science MCQs across Data Structures, Algorithms, OS, DBMS, Computer Networks, and Theory of Computation. Free, no sign-up required.',
    keywords: [
      'GATE CSE', 'GATE Computer Science', 'GATE CSE preparation', 'GATE CSE syllabus',
      'GATE CSE mock test', 'GATE CSE practice questions',
    ],
    alternates: { canonical: `/exams/${SLUG}` },
    openGraph: {
      title: 'GATE CSE Preparation — Free MCQ Practice & Topic-Wise Tests',
      description: 'Topic-wise GATE CSE MCQs across core Computer Science subjects.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'GATE CSE Preparation — Free MCQ Practice & Topic-Wise Tests',
      description: 'Topic-wise GATE CSE MCQs across core Computer Science subjects.',
    },
  };
}

const HIGHLIGHTS = [
  {
    icon: Binary,
    title: 'Core CS fundamentals first',
    description: 'Data Structures, Algorithms, and Digital Logic — the topics GATE tests most consistently.',
  },
  {
    icon: Database,
    title: 'DBMS & Operating Systems',
    description: 'Deep topic-wise sets on transactions, indexing, scheduling, and memory management.',
  },
  {
    icon: Network,
    title: 'Computer Networks coverage',
    description: 'From the OSI model to routing and congestion control, with GATE-style numericals.',
  },
  {
    icon: GitBranch,
    title: 'Theory of Computation & Compilers',
    description: 'Automata, grammars, and compiler design — the sections most candidates underprepare for.',
  },
  {
    icon: Cpu,
    title: 'Computer Organization & Architecture',
    description: 'Pipelining, cache, and memory hierarchy explained through practice, not just theory.',
  },
  {
    icon: Trophy,
    title: 'Full-length mock tests',
    description: 'Simulate the real GATE CSE paper with scoring, negative marking, and detailed solutions.',
  },
];

const SYLLABUS = [
  {
    name: 'Data Structures & Algorithms',
    weight: 'High weight',
    topics: ['Arrays & Linked Lists', 'Trees & Graphs', 'Sorting & Searching', 'Complexity Analysis', 'Dynamic Programming'],
  },
  {
    name: 'Operating Systems',
    weight: 'High weight',
    topics: ['Process Scheduling', 'Concurrency', 'Deadlocks', 'Memory Management', 'File Systems'],
  },
  {
    name: 'Database Management Systems',
    weight: 'High weight',
    topics: ['ER Model', 'Normalization', 'SQL', 'Transactions', 'Indexing'],
  },
  {
    name: 'Computer Networks',
    weight: 'Medium weight',
    topics: ['OSI & TCP/IP', 'Routing', 'Congestion Control', 'Network Security Basics'],
  },
  {
    name: 'Theory of Computation',
    weight: 'Medium weight',
    topics: ['Finite Automata', 'Regular Languages', 'Context-Free Grammars', 'Turing Machines'],
  },
  {
    name: 'Digital Logic & Computer Organization',
    weight: 'Medium weight',
    topics: ['Boolean Algebra', 'Combinational Circuits', 'Pipelining', 'Cache & Memory Hierarchy'],
  },
];

const FAQ = [
  {
    question: 'What is GATE CSE?',
    answer:
      'GATE (Graduate Aptitude Test in Engineering) Computer Science is a national exam used for admission to postgraduate engineering programmes and for PSU recruitment, testing core CS fundamentals and general aptitude.',
  },
  {
    question: 'Which GATE CSE topics carry the most weight?',
    answer:
      'Data Structures & Algorithms, Operating Systems, and DBMS are historically the highest-weight areas, followed by Computer Networks and Theory of Computation.',
  },
  {
    question: 'Is GATE CSE practice on this platform free?',
    answer:
      'Yes, topic-wise MCQ practice is free with no sign-up required. An account is only needed to save progress or take scored mock tests.',
  },
  {
    question: 'How is GATE CSE different from typical college exams?',
    answer:
      'GATE emphasizes conceptual depth and numerical problem-solving over rote recall, with negative marking, so timed topic-wise practice matters more than memorization.',
  },
];

export default function GateCseLandingPage() {
  return (
    <>
      <ExamHero
        eyebrow="Graduate Aptitude Test in Engineering"
        title="Master GATE CSE with topic-wise MCQ practice"
        description="Build depth across Data Structures, Algorithms, OS, DBMS, Computer Networks, and Theory of Computation — free, no sign-up needed to get started."
        primaryCtaHref={PRACTICE_HREF}
        stats={[
          { label: 'Core subjects', value: '6+' },
          { label: 'Exam duration', value: '180 min' },
          { label: 'Negative marking', value: 'Yes' },
          { label: 'Sign-up needed', value: 'No' },
        ]}
      />
      <ExamHighlights title="Why practice GATE CSE here" items={HIGHLIGHTS} />
      <ExamSyllabus title="GATE CSE syllabus, subject by subject" groups={SYLLABUS} />
      <ExamFaq title="GATE CSE FAQs" items={FAQ} />

      <ExamFinalCta
        title="Start practicing GATE CSE now"
        description="Free, topic-wise MCQs with instant explanations — no account required."
        ctaLabel="Go to Practice"
        ctaHref={PRACTICE_HREF}
      />

      <ExamFinalCta
        title="Ready for a full-length GATE CSE mock test?"
        description="Simulate exam-day conditions with scoring, negative marking, and instant solutions."
        ctaLabel="Browse Previous Year Papers"
        ctaHref={`/pyp/${SLUG}`}
      />
    </>
  );
}
