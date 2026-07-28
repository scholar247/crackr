import type { Metadata } from 'next';
import { Scale, Clock3, GraduationCap, ListTodo, Layers, Repeat1 } from 'lucide-react';
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
    title: 'GATE CSE 2027 Syllabus, Pattern & Free Mocks',
    description:
      'Crack GATE CSE 2027 with free topic-wise mock tests & PYQs. Get the latest IIT Madras exam pattern, syllabus weightage and prep plan on crackr.',
    keywords: [
      'GATE CSE 2027 syllabus and exam pattern', 'GATE CSE free mock test online', 'GATE Computer Science previous year papers PDF',
      'GATE CSE subject wise weightage', 'GATE CSE negative marking rules MCQ MSQ NAT', 'GATE CSE eligibility criteria 2027',
      'GATE CSE topic wise practice questions', 'GATE CSE cutoff for IIT M.Tech admission',
    ],
    alternates: { canonical: `/exams/${SLUG}` },
    openGraph: {
      title: 'GATE CSE 2027 — Syllabus, Exam Pattern & Free Mock Tests',
      description: 'GATE Computer Science is India’s national gateway to M.Tech admissions and PSU recruitment. Free topic-wise MCQs, MSQs and NATs.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'GATE CSE 2027 — Syllabus, Exam Pattern & Free Mock Tests',
      description: 'GATE Computer Science is India’s national gateway to M.Tech admissions and PSU recruitment. Free topic-wise MCQs, MSQs and NATs.',
    },
  };
}

const HIGHLIGHTS = [
  {
    icon: Scale,
    title: 'Marking varies by question type',
    description: 'MCQs carry negative marking (−1/3 or −2/3); MSQs and NATs have zero negative marking, and MSQs give no partial credit.',
  },
  {
    icon: Clock3,
    title: '100 marks, one 3-hour shot',
    description: 'General Aptitude (15) + Engineering Mathematics (13) + core CS/IT (72) in a single CBT session — no separate GA sitting.',
  },
  {
    icon: GraduationCap,
    title: 'Eligibility starts from final year',
    description: '3rd year+ of a B.E./B.Tech./B.Arch./B.Pharm. (or equivalent), or already holding the degree. No age limit.',
  },
  {
    icon: ListTodo,
    title: 'Three formats, one curveball',
    description: 'Beyond MCQs, GATE CSE tests MSQs (one-or-more correct, no partial marks) and NATs (typed numeric answer, no options to eliminate).',
  },
  {
    icon: Layers,
    title: 'Dual-purpose exam',
    description: 'One score powers M.Tech admission via COAP at 20+ IITs, IISc, NITs and IIITs, and direct-recruitment drives at PSUs.',
  },
  {
    icon: Repeat1,
    title: 'One shot per cycle',
    description: 'Spread across multiple February dates, but each candidate gets only one allotted slot — no retake within the same cycle.',
  },
];

const SYLLABUS = [
  {
    name: 'General Aptitude',
    weight: '~15 marks (15%)',
    topics: ['Verbal Ability & Reading Comprehension', 'Quantitative Aptitude', 'Numerical Estimation', 'Analytical Reasoning', 'Logical Deduction', 'Data Interpretation'],
  },
  {
    name: 'Engineering Mathematics & Discrete Structures',
    weight: '~13 marks (13%)',
    topics: ['Propositional & First-Order Logic', 'Sets, Relations & Functions', 'Graph Theory', 'Combinatorics', 'Linear Algebra', 'Calculus', 'Probability & Statistics'],
  },
  {
    name: 'Digital Logic & Computer Organization/Architecture',
    weight: '~15 marks (15%)',
    topics: ['Boolean Algebra & Minimization', 'Combinational & Sequential Circuits', 'Number Representation', 'Machine Instructions & Addressing Modes', 'ALU/Datapath/Control Unit', 'Pipelining', 'Memory Hierarchy'],
  },
  {
    name: 'Programming, Data Structures & Algorithms',
    weight: '~17 marks (17%, highest-weight cluster)',
    topics: ['C Programming & Recursion', 'Arrays/Stacks/Queues/Linked Lists', 'Trees & Graphs', 'Hashing', 'Asymptotic Complexity', 'Sorting & Searching', 'Greedy/DP/Divide-and-Conquer', 'Graph Algorithms'],
  },
  {
    name: 'Theory of Computation & Compiler Design',
    weight: '~14 marks (14%)',
    topics: ['Regular Languages & Finite Automata', 'Context-Free Grammars & PDA', 'Turing Machines & Decidability', 'Lexical Analysis', 'Parsing (LL/LR)', 'Syntax-Directed Translation', 'Code Optimization'],
  },
  {
    name: 'Operating Systems, DBMS & Computer Networks',
    weight: '~24 marks (24%, largest combined share)',
    topics: ['Process Scheduling & Synchronization', 'Deadlocks', 'Memory & Virtual Memory Management', 'File Systems', 'ER Model & Relational Algebra', 'SQL, Normalization & Transactions', 'Indexing', 'OSI/TCP-IP & Routing'],
  },
];

const FAQ = [
  {
    question: 'Who is eligible for GATE CSE?',
    answer:
      'Candidates currently in the 3rd year or higher of a B.E./B.Tech./B.Arch./B.Pharm. (or equivalent 4-year degree), or already holding one, can apply. B.Sc./B.Com./BCA and postgraduate science students are also eligible under specific conditions. There’s no age limit.',
  },
  {
    question: 'What is the exam pattern for GATE CSE?',
    answer:
      'GATE CSE is a 3-hour Computer-Based Test with 65 questions worth 100 marks — General Aptitude (15), Engineering Mathematics (13) and core CS/IT (72) — using MCQ, MSQ and NAT formats, with negative marking only on MCQs.',
  },
  {
    question: 'How should I start preparing for GATE CSE?',
    answer:
      'Start with the highest-weightage areas — Programming & Data Structures, Operating Systems, DBMS and Computer Networks — build concepts from standard textbooks, then reinforce daily with topic-wise MCQs and full-length mocks while tracking previous-year-question trends.',
  },
  {
    question: 'Is GATE CSE conducted online or offline?',
    answer:
      'It’s conducted online as a Computer-Based Test (CBT) at designated test centres across multiple cities, in a single 3-hour session per candidate — there’s no offline/pen-paper option.',
  },
  {
    question: 'Does negative marking apply to every question type?',
    answer:
      'No. Negative marking applies only to MCQs (−1/3 for a wrong 1-mark question, −2/3 for a wrong 2-mark question). MSQs and NATs carry zero negative marking, though MSQs also give no partial credit.',
  },
];

export default function GateCseLandingPage() {
  return (
    <>
      <ExamHero
        eyebrow="Conducted by IIT Madras (GATE 2027) — National CBT for M.Tech Admission & PSU Recruitment"
        title="GATE CSE 2027 — Syllabus, Exam Pattern & Free Mock Tests"
        description="GATE Computer Science and Information Technology is India's national gateway to M.Tech admissions at IITs, NITs and IIITs, and to direct recruitment at top PSUs. Practice free, topic-wise MCQs, MSQs and NATs on crackr to master every high-weightage subject before exam day."
        primaryCtaHref={PRACTICE_HREF}
        stats={[
          { label: 'Sections', value: 'GA + Maths + Core CS' },
          { label: 'Exam duration', value: '180 min' },
          { label: 'Total questions', value: '65 / 100 marks' },
          { label: 'Mode', value: 'Online CBT' },
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
        title="Where can your GATE score take you?"
        description="See recent COAP closing scores for M.Tech CSE at IIT Bombay, Delhi, Kharagpur, Madras and top NITs."
        ctaLabel="Read the full cutoff guide"
        ctaHref="/blogs/gate-cse-top-colleges-cutoffs"
      />

      <ExamFinalCta
        title="Practicing with real exam questions works best"
        description="Read our full GATE CSE previous year papers guide and turn every past question into targeted practice."
        ctaLabel="Browse Previous Year Papers"
        ctaHref="/blogs/gate-cse-previous-year-papers"
      />
    </>
  );
}
