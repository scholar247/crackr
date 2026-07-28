import type { Metadata } from 'next';
import { Scale, Calculator, GraduationCap, Clock, AlertTriangle, MinusCircle } from 'lucide-react';
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
    title: 'NIMCET 2026 Syllabus, Pattern & Free Mocks | crackr',
    description:
      'Crack NIMCET 2026 (NIT MCA entrance by NIT Trichy). Practice free topic-wise MCQs, master the 1000-mark exam pattern & download PYPs on crackr.',
    keywords: [
      'NIMCET 2026 syllabus pdf', 'NIMCET exam pattern and marking scheme', 'NIMCET free mock test online',
      'NIMCET previous year question papers with solutions', 'NIMCET eligibility criteria BCA BSc',
      'NIT MCA entrance exam preparation', 'NIMCET topic wise weightage mathematics', 'NIMCET 2026 cutoff NIT Trichy Warangal',
    ],
    alternates: { canonical: `/exams/${SLUG}` },
    openGraph: {
      title: 'NIMCET 2026 — Syllabus, Exam Pattern & Free Mock Tests',
      description: 'NIMCET is the national gateway to MCA programs at 11 NITs and 2 IIITs. Free topic-wise MCQs and full-length mocks.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'NIMCET 2026 — Syllabus, Exam Pattern & Free Mock Tests',
      description: 'NIMCET is the national gateway to MCA programs at 11 NITs and 2 IIITs. Free topic-wise MCQs and full-length mocks.',
    },
  };
}

const HIGHLIGHTS = [
  {
    icon: Scale,
    title: 'Weighted marking, not flat +4/-1',
    description: 'Mathematics carries 12 marks per correct answer (−3 wrong); Reasoning & Computer Awareness carry 6 (−1.5); English carries 4 (−1).',
  },
  {
    icon: Calculator,
    title: 'Math does the heavy lifting',
    description: 'Mathematics alone accounts for 600 of 1000 total marks — 60% of the paper, and the single biggest lever for your rank.',
  },
  {
    icon: GraduationCap,
    title: 'Eligibility baseline',
    description: 'A 3-year UG degree (BSc/BCA/BIT with Maths/Statistics) or BE/BTech, with ≥60% aggregate for General/OBC/EWS or ≥55% for SC/ST/PwD.',
  },
  {
    icon: Clock,
    title: 'Sectional time-lock format',
    description: 'The paper runs in 3 sequential, individually timed parts — once a section’s time is up, you can’t go back to it.',
  },
  {
    icon: AlertTriangle,
    title: 'Zero-tolerance qualifying rule',
    description: 'Score zero or negative in Mathematics, or in your total, and you’re disqualified — regardless of your other section scores.',
  },
  {
    icon: MinusCircle,
    title: '25% negative marking throughout',
    description: 'Every wrong answer costs a quarter of that section’s per-question marks; unattempted questions cost nothing.',
  },
];

const SYLLABUS = [
  {
    name: 'Mathematics',
    weight: '50 Qs / 600 Marks',
    topics: ['Set Theory & Logic', 'Algebra', 'Coordinate Geometry', 'Calculus', 'Trigonometry', 'Progressions', 'Probability & Statistics', 'Logarithms & Exponentials'],
  },
  {
    name: 'Analytical Ability & Logical Reasoning',
    weight: '40 Qs / 240 Marks',
    topics: ['Blood Relations', 'Coding-Decoding', 'Direction Test', 'Seating Arrangement & Puzzles', 'Syllogism', 'Statements & Conclusions', 'Data Interpretation', 'Data Sufficiency'],
  },
  {
    name: 'Computer Awareness',
    weight: '20 Qs / 120 Marks',
    topics: ['Computer Organization & CPU', 'Data Representation', 'I/O & Storage Devices', 'Operating Systems Basics', 'Memory (RAM/ROM/Cache)', 'Internet & Online Security'],
  },
  {
    name: 'General English',
    weight: '10 Qs / 40 Marks',
    topics: ['Reading Comprehension', 'Vocabulary & Word Usage', 'Grammar & Sentence Structure', 'Synonyms & Antonyms', 'Error Spotting'],
  },
];

const FAQ = [
  {
    question: 'Who is eligible for NIMCET?',
    answer:
      'Indian nationals with a 3-year UG degree (BSc/BCA/BIT etc.) including Maths/Statistics, or a BE/BTech, are eligible. You need at least 60% aggregate (6.5 CGPA) for General/OBC/EWS, or 55% (6.0 CGPA) for SC/ST/PwD candidates.',
  },
  {
    question: 'What is the exam pattern for NIMCET?',
    answer:
      'NIMCET has 120 MCQs across 4 sections — Mathematics (50Q), Analytical Ability & Logical Reasoning (40Q), Computer Awareness (20Q), and General English (10Q) — worth 1000 total marks, with section-wise weighted marking and 25% negative marking, over 120 minutes.',
  },
  {
    question: 'How should I start preparing for NIMCET?',
    answer:
      'Since Mathematics carries 60% of total marks, master it first — algebra, calculus, and coordinate geometry especially. Layer in daily reasoning practice and computer awareness basics, then take timed sectional mocks to build speed under the strict per-part time limits.',
  },
  {
    question: 'Is NIMCET conducted online or offline?',
    answer:
      'NIMCET is conducted online as a Computer-Based Test (CBT) at designated test centres, in English only, with candidates working through three sequentially timed sections on a computer terminal.',
  },
  {
    question: 'Which colleges accept the NIMCET score?',
    answer:
      'NIMCET scores are accepted by 11 NITs (Agartala, Allahabad, Bhopal, Delhi, Jamshedpur, Kurukshetra, Meghalaya, Patna, Raipur, Tiruchirappalli, Warangal) and 2 IIITs (Bhopal, Vadodara), offering roughly 1,300 MCA seats nationwide.',
  },
];

export default function NimcetLandingPage() {
  return (
    <>
      <ExamHero
        eyebrow="Conducted by NIT Tiruchirappalli on behalf of 11 NITs & 2 IIITs"
        title="NIMCET 2026 — Syllabus, Exam Pattern & Free Mock Tests for NIT MCA Admission"
        description="NIMCET is the national gateway to MCA programs at 11 NITs and 2 IIITs, deciding your rank purely on one 120-minute test. Practice free, topic-wise MCQs and full-length mocks on crackr to build the speed and accuracy this exam demands."
        primaryCtaHref={PRACTICE_HREF}
        stats={[
          { label: 'Sections', value: '4' },
          { label: 'Exam duration', value: '120 min' },
          { label: 'Total questions', value: '120' },
          { label: 'Mode', value: 'Online CBT' },
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
        title="Where can NIMCET take you?"
        description="See closing ranks at NIT Trichy, Warangal, MNNIT Allahabad, MANIT Bhopal & more from the latest counselling round."
        ctaLabel="Read the full cutoff guide"
        ctaHref="/blogs/nimcet-top-nit-colleges-cutoffs"
      />

      <ExamFinalCta
        title="Practicing with real exam questions works best"
        description="Read our full NIMCET previous year papers guide and start solving real exam-pattern questions today."
        ctaLabel="Browse Previous Year Papers"
        ctaHref="/blogs/nimcet-previous-year-papers"
      />
    </>
  );
}
