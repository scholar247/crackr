// Static config for well-known exams — drives the exam hub page UI.
// Falls back to generic layout for slugs not in this map.

export type ExamSubjectPattern = {
  name: string;
  shortName: string;
  questions: number;
  marks: number;
  color: string;
  weight: number; // % of total marks
};

export type ExamConfig = {
  slug: string;
  name: string;
  fullName: string;
  conductedBy: string;
  category: string;
  examDate: string; // ISO date string (tentative)
  examDateLabel: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  correctMarks: number;
  negativeMarks: number;
  negativeLabel: string;
  subjects: ExamSubjectPattern[];
  tips: { title: string; desc: string; colorKey: string }[];
  keyFacts: { label: string; value: string }[];
  officialSite: string;
  heroTagline: string;
  heroDesc: string;
  accentColor: string; // Tailwind color class suffix (e.g. 'indigo')
};

const configs: ExamConfig[] = [
  // ─── NIMCET ──────────────────────────────────────────────────────────────────
  {
    slug: 'nimcet',
    name: 'NIMCET',
    fullName: 'National Institute of Technology MCA Common Entrance Test',
    conductedBy: 'NIT Warangal',
    category: 'MCA Entrance',
    examDate: '2025-06-01T09:00:00+05:30',
    examDateLabel: 'June 2025 (tentative)',
    totalQuestions: 120,
    totalMarks: 480,
    durationMinutes: 120,
    correctMarks: 4,
    negativeMarks: 1,
    negativeLabel: '−1 wrong',
    subjects: [
      { name: 'Mathematics', shortName: 'Math', questions: 50, marks: 200, color: '#6366f1', weight: 41.7 },
      { name: 'Analytical Ability & Logical Reasoning', shortName: 'Reasoning', questions: 40, marks: 160, color: '#f59e0b', weight: 33.3 },
      { name: 'Computer Applications', shortName: 'CS', questions: 10, marks: 40, color: '#0ea5e9', weight: 8.3 },
      { name: 'General English', shortName: 'English', questions: 10, marks: 40, color: '#10b981', weight: 8.3 },
      { name: 'General Awareness', shortName: 'GK', questions: 10, marks: 40, color: '#ec4899', weight: 8.3 },
    ],
    tips: [
      { title: 'Master Maths First', desc: '50 questions = 41.7% of paper. Calculus, Probability & Vectors are high-yield.', colorKey: 'indigo' },
      { title: 'Speed in Reasoning', desc: '40 questions in under 40 min. Practice seating arrangements & syllogisms daily.', colorKey: 'amber' },
      { title: 'Negative Marking', desc: '+4/−1 scheme. Attempt 90+ with >80% accuracy for a top-100 rank.', colorKey: 'rose' },
      { title: '2-Minute Rule', desc: 'Never spend > 2 min on any question. Mark & move; return if time allows.', colorKey: 'sky' },
    ],
    keyFacts: [
      { label: 'Participating NITs', value: '30+' },
      { label: 'Seats', value: '~3,000' },
      { label: 'Mode', value: 'Computer Based' },
      { label: 'Attempts', value: 'No limit' },
    ],
    officialSite: 'https://nimcet.in',
    heroTagline: 'Crack NIMCET 2025',
    heroDesc: 'Your complete preparation hub for NIT MCA — structured courses, subject-wise practice, live sessions & mock tests.',
    accentColor: 'indigo',
  },

  // ─── JEE Main ────────────────────────────────────────────────────────────────
  {
    slug: 'jee-main',
    name: 'JEE Main',
    fullName: 'Joint Entrance Examination (Main)',
    conductedBy: 'NTA',
    category: 'Engineering',
    examDate: '2025-04-01T09:00:00+05:30',
    examDateLabel: 'Jan & Apr 2025',
    totalQuestions: 90,
    totalMarks: 300,
    durationMinutes: 180,
    correctMarks: 4,
    negativeMarks: 1,
    negativeLabel: '−1 wrong (MCQ), no negative for Numerical',
    subjects: [
      { name: 'Physics', shortName: 'Physics', questions: 30, marks: 100, color: '#f59e0b', weight: 33.3 },
      { name: 'Chemistry', shortName: 'Chemistry', questions: 30, marks: 100, color: '#10b981', weight: 33.3 },
      { name: 'Mathematics', shortName: 'Maths', questions: 30, marks: 100, color: '#6366f1', weight: 33.3 },
    ],
    tips: [
      { title: 'NCERT is the Bible', desc: 'Chemistry NCERT alone can fetch 60–70% marks. Read every line.', colorKey: 'emerald' },
      { title: 'Numerical accuracy', desc: '10 numerical questions per subject — no negative marking. Never leave them blank.', colorKey: 'amber' },
      { title: 'Previous Year Papers', desc: 'Solve all PYQs from 2015–2024. NTA heavily repeats concepts and formats.', colorKey: 'indigo' },
      { title: 'Time per question', desc: '2 min/question average. Physics numericals can eat time — allocate wisely.', colorKey: 'sky' },
    ],
    keyFacts: [
      { label: 'Qualifying for', value: 'NITs, IIITs, CFTIs, JEE Advanced' },
      { label: 'Sessions', value: '2 per year' },
      { label: 'Mode', value: 'Online (CBT)' },
      { label: 'Best of 2', value: 'Score counted' },
    ],
    officialSite: 'https://jeemain.nta.ac.in',
    heroTagline: 'Crack JEE Main 2025',
    heroDesc: 'Targeted practice for Physics, Chemistry & Maths — full-length mocks, chapter-wise questions, and live doubt sessions.',
    accentColor: 'orange',
  },

  // ─── JEE Advanced ────────────────────────────────────────────────────────────
  {
    slug: 'jee-advanced',
    name: 'JEE Advanced',
    fullName: 'Joint Entrance Examination (Advanced)',
    conductedBy: 'IITs (rotating)',
    category: 'Engineering',
    examDate: '2025-05-18T09:00:00+05:30',
    examDateLabel: 'May 2025',
    totalQuestions: 54,
    totalMarks: 360,
    durationMinutes: 180,
    correctMarks: 3,
    negativeMarks: 1,
    negativeLabel: 'Partial/negative varies per question type',
    subjects: [
      { name: 'Physics', shortName: 'Physics', questions: 18, marks: 120, color: '#f59e0b', weight: 33.3 },
      { name: 'Chemistry', shortName: 'Chemistry', questions: 18, marks: 120, color: '#10b981', weight: 33.3 },
      { name: 'Mathematics', shortName: 'Maths', questions: 18, marks: 120, color: '#6366f1', weight: 33.3 },
    ],
    tips: [
      { title: 'Concept depth > breadth', desc: 'Advanced tests deep conceptual understanding, not just formula application. Go beyond NCERT.', colorKey: 'indigo' },
      { title: 'Multiple question types', desc: 'MCQ, multiple correct, integer, matching — each with different marking. Read carefully.', colorKey: 'amber' },
      { title: 'Paper 1 & Paper 2', desc: 'Both papers are 3 hours each on the same day. Stamina and time management are crucial.', colorKey: 'rose' },
      { title: 'Mock strategy', desc: 'Simulate exact exam conditions. Identify patterns in which question types you lose marks.', colorKey: 'sky' },
    ],
    keyFacts: [
      { label: 'Qualifying for', value: 'IITs (all branches)' },
      { label: 'Eligibility', value: 'Top 2.5L in JEE Main' },
      { label: 'Papers', value: '2 papers × 3 hrs' },
      { label: 'Attempts', value: '2 consecutive years' },
    ],
    officialSite: 'https://jeeadv.ac.in',
    heroTagline: 'Crack JEE Advanced 2025',
    heroDesc: 'Deep concept-level preparation for IIT admissions — advanced problem solving, full mock papers, and expert mentorship.',
    accentColor: 'amber',
  },

  // ─── NEET ─────────────────────────────────────────────────────────────────────
  {
    slug: 'neet-ug',
    name: 'NEET-UG',
    fullName: 'National Eligibility cum Entrance Test (UG)',
    conductedBy: 'NTA',
    category: 'Medical',
    examDate: '2025-05-04T09:00:00+05:30',
    examDateLabel: 'May 4, 2025',
    totalQuestions: 200,
    totalMarks: 720,
    durationMinutes: 200,
    correctMarks: 4,
    negativeMarks: 1,
    negativeLabel: '−1 wrong',
    subjects: [
      { name: 'Physics', shortName: 'Physics', questions: 50, marks: 180, color: '#f59e0b', weight: 25 },
      { name: 'Chemistry', shortName: 'Chemistry', questions: 50, marks: 180, color: '#10b981', weight: 25 },
      { name: 'Botany', shortName: 'Botany', questions: 50, marks: 180, color: '#84cc16', weight: 25 },
      { name: 'Zoology', shortName: 'Zoology', questions: 50, marks: 180, color: '#ec4899', weight: 25 },
    ],
    tips: [
      { title: 'Biology = 50% paper', desc: 'Botany + Zoology = 360 marks. NCERT line-by-line study is non-negotiable.', colorKey: 'emerald' },
      { title: 'Diagrams matter', desc: 'At least 20–25 questions are directly from NCERT diagrams. Practice drawing them.', colorKey: 'pink' },
      { title: 'Physics strategy', desc: 'Focus on mechanics, modern physics, and optics. These chapters repeat heavily.', colorKey: 'amber' },
      { title: 'Answer 180+', desc: 'Attempt 180+ with 90%+ accuracy to score 650+. Biology accuracy is key.', colorKey: 'sky' },
    ],
    keyFacts: [
      { label: 'Qualifying for', value: 'MBBS, BDS, BAMS across India' },
      { label: 'Mode', value: 'Pen & Paper (OMR)' },
      { label: 'Attempts', value: 'No limit (age: 17–25)' },
      { label: 'Seats', value: '1 Lakh+ MBBS seats' },
    ],
    officialSite: 'https://neet.nta.nic.in',
    heroTagline: 'Crack NEET-UG 2025',
    heroDesc: 'Expert-curated MCQs for Physics, Chemistry, Botany & Zoology — with NCERT-aligned content, full mocks, and rank predictors.',
    accentColor: 'emerald',
  },

  // ─── CUET ─────────────────────────────────────────────────────────────────────
  {
    slug: 'cuet',
    name: 'CUET-UG',
    fullName: 'Common University Entrance Test (UG)',
    conductedBy: 'NTA',
    category: 'University Entrance',
    examDate: '2025-05-15T09:00:00+05:30',
    examDateLabel: 'May 2025',
    totalQuestions: 75,
    totalMarks: 300,
    durationMinutes: 60,
    correctMarks: 5,
    negativeMarks: 1,
    negativeLabel: '−1 wrong',
    subjects: [
      { name: 'Section IA — Languages', shortName: 'Language', questions: 50, marks: 200, color: '#8b5cf6', weight: 33.3 },
      { name: 'Section II — Domain Subjects', shortName: 'Domain', questions: 40, marks: 160, color: '#0ea5e9', weight: 33.3 },
      { name: 'Section III — General Test', shortName: 'General', questions: 60, marks: 240, color: '#f59e0b', weight: 33.3 },
    ],
    tips: [
      { title: 'Choose domains wisely', desc: 'You must choose domains matching your Class 12 subjects. Max score = best 6 subjects.', colorKey: 'violet' },
      { title: 'Language paper is scorable', desc: 'Reading comprehension and vocabulary in the language section is highly predictable.', colorKey: 'sky' },
      { title: 'General Test = wildcard', desc: 'Covers GK, reasoning, quantitative aptitude. Practice past papers — patterns repeat.', colorKey: 'amber' },
      { title: 'Speed is critical', desc: '60 min for 50 questions = 72 sec/question. No time to re-read — practise timed mocks daily.', colorKey: 'rose' },
    ],
    keyFacts: [
      { label: 'Universities', value: '250+ central universities' },
      { label: 'Mode', value: 'Computer Based' },
      { label: 'Medium', value: '13 languages' },
      { label: 'Domains', value: '27 domain subjects' },
    ],
    officialSite: 'https://cuet.nta.nic.in',
    heroTagline: 'Crack CUET-UG 2025',
    heroDesc: 'Focused prep for central university admissions — domain-wise MCQs, language practice, and general test mock tests.',
    accentColor: 'violet',
  },
];

const configMap = new Map(configs.map((c) => [c.slug, c]));

export function getExamConfig(slug: string): ExamConfig | null {
  return configMap.get(slug) ?? null;
}

export function getAllConfiguredExams(): ExamConfig[] {
  return configs;
}

// Accent colors map to Tailwind-compatible values
export const ACCENT_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-300/40 dark:border-indigo-700/40',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-300/40 dark:border-orange-700/40',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300/40 dark:border-amber-700/40',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300/40 dark:border-emerald-700/40',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-300/40 dark:border-violet-700/40',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  },
  sky: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-300/40 dark:border-sky-700/40',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    badge: 'bg-primary/10 text-primary',
  },
};
