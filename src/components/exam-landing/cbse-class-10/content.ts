// Editorial content for the CBSE Class 10 landing page — the parts that don't live in the
// database (paper pattern, dates, roadmap, FAQs). Review every academic session: CBSE
// publishes the date sheet around December and new sample question papers each year.

export const SESSION_LABEL = '2026–27';

/**
 * Expected start of the main (Phase 1) board exam. CBSE hasn't released the 2027 date sheet
 * yet, so this is an estimate based on previous years (mid-February) and is shown as such.
 */
export const BOARD_EXAM = {
  startsOn: '2027-02-17T09:30:00+05:30',
  isTentative: true,
};

export type SubjectKey = 'maths' | 'science' | 'social-science' | 'english';

/** Maps a syllabus subject (e.g. "Mathematics (Class 10)") to its editorial key by slug. */
export function subjectKeyFor(slug: string): SubjectKey | null {
  if (slug.includes('social')) return 'social-science';
  if (slug.includes('math')) return 'maths';
  if (slug.includes('science')) return 'science';
  if (slug.includes('english')) return 'english';
  return null;
}

/** "Mathematics (Class 10)" → "Mathematics": the class is already obvious on this page. */
export function shortSubjectName(name: string) {
  return name.replace(/\s*\(class\s*10\)\s*$/i, '');
}

export interface PaperSection {
  name: string;
  questionType: string;
  marks: number;
}

export interface SubjectPattern {
  theoryMarks: number;
  internalMarks: number;
  durationHours: number;
  sections: PaperSection[];
  note?: string;
}

// Section structure per the CBSE 2025–26 sample question papers.
export const SUBJECT_PATTERNS: Record<SubjectKey, SubjectPattern> = {
  maths: {
    theoryMarks: 80,
    internalMarks: 20,
    durationHours: 3,
    sections: [
      { name: 'A', questionType: '20 MCQs incl. 2 assertion–reason (1 mark each)', marks: 20 },
      { name: 'B', questionType: '5 very short answers (2 marks each)', marks: 10 },
      { name: 'C', questionType: '6 short answers (3 marks each)', marks: 18 },
      { name: 'D', questionType: '4 long answers (5 marks each)', marks: 20 },
      { name: 'E', questionType: '3 case-based questions (4 marks each)', marks: 12 },
    ],
    note: 'Choose Mathematics Standard (041) if you plan to take Maths in Class 11, otherwise Basic (241). Both follow this structure.',
  },
  science: {
    theoryMarks: 80,
    internalMarks: 20,
    durationHours: 3,
    sections: [
      { name: 'A', questionType: '20 MCQs incl. 4 assertion–reason (1 mark each)', marks: 20 },
      { name: 'B', questionType: '6 very short answers (2 marks each)', marks: 12 },
      { name: 'C', questionType: '7 short answers (3 marks each)', marks: 21 },
      { name: 'D', questionType: '3 long answers (5 marks each)', marks: 15 },
      { name: 'E', questionType: '3 case-based questions (4 marks each)', marks: 12 },
    ],
  },
  'social-science': {
    theoryMarks: 80,
    internalMarks: 20,
    durationHours: 3,
    sections: [
      { name: 'A', questionType: '20 MCQs (1 mark each)', marks: 20 },
      { name: 'B', questionType: '4 very short answers (2 marks each)', marks: 8 },
      { name: 'C', questionType: '5 short answers (3 marks each)', marks: 15 },
      { name: 'D', questionType: '4 long answers (5 marks each)', marks: 20 },
      { name: 'E', questionType: '3 case-based questions (4 marks each)', marks: 12 },
      { name: 'F', questionType: 'Map work — History and Geography', marks: 5 },
    ],
  },
  english: {
    theoryMarks: 80,
    internalMarks: 20,
    durationHours: 3,
    sections: [
      { name: 'A', questionType: 'Reading — two unseen passages', marks: 20 },
      { name: 'B', questionType: 'Grammar and writing (letter, analytical paragraph)', marks: 20 },
      { name: 'C', questionType: 'Literature — First Flight and Footprints without Feet', marks: 40 },
    ],
  },
};

export const PATTERN_HIGHLIGHTS = [
  { label: 'Theory paper', value: '80 marks', detail: '3 hours, one paper per subject' },
  { label: 'Internal assessment', value: '20 marks', detail: 'Periodic tests, notebooks, projects' },
  { label: 'To pass', value: '33%', detail: 'Per subject, theory + internal combined' },
  { label: 'Competency-based', value: '~50%', detail: 'Case-based, source-based, application questions' },
];

export interface RoadmapPhase {
  id: string;
  title: string;
  window: string;
  /** Months (1–12) this phase covers — used to highlight where the student is today. */
  months: number[];
  focus: string[];
}

export const ROADMAP: RoadmapPhase[] = [
  {
    id: 'foundation',
    title: 'Build the foundation',
    window: 'April – September',
    months: [4, 5, 6, 7, 8, 9],
    focus: ['Read every NCERT chapter once', 'Solve in-text and exercise questions', 'Make short notes as you go'],
  },
  {
    id: 'complete',
    title: 'Finish the syllabus',
    window: 'October – November',
    months: [10, 11],
    focus: ['Close pending chapters', 'Chapter-wise PYQs after each chapter', 'Mark weak chapters for revision'],
  },
  {
    id: 'pre-boards',
    title: 'Pre-boards & sample papers',
    window: 'December – January',
    months: [12, 1],
    focus: ['Timed full papers every week', 'Solve the latest CBSE sample papers', 'Revise mistakes, not just chapters'],
  },
  {
    id: 'boards',
    title: 'Board exam',
    window: 'February – March',
    months: [2, 3],
    focus: ['Light revision of formulas, maps and diagrams', 'Sleep and timing over late-night cramming', 'Practise answer presentation'],
  },
  {
    id: 'second-exam',
    title: 'Optional second exam',
    window: 'May',
    months: [5],
    focus: ['Improve scores in up to three subjects', 'Focus only on the subjects you chose'],
  },
];

/** The roadmap phase for a given date, by month in IST (the audience's calendar). */
export function currentPhase(now = new Date()): RoadmapPhase {
  const istMonth = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCMonth() + 1;
  // May is both "foundation" (new session) and "second exam"; the second exam is the more urgent one.
  return [...ROADMAP].reverse().find((p) => p.months.includes(istMonth)) ?? ROADMAP[0];
}

export const FAQS = [
  {
    question: 'How many board exams are there for CBSE Class 10?',
    answer:
      'From 2026, CBSE holds two Class 10 board exams. The main exam in February is compulsory. A second exam in May is optional and lets you improve your score in up to three subjects (Science, Mathematics, Social Science and languages). Your better score counts.',
  },
  {
    question: 'What are the passing marks for CBSE Class 10?',
    answer:
      'You need at least 33% in each subject, counting the 80-mark theory paper and the 20-mark internal assessment together. That is 33 out of 100.',
  },
  {
    question: 'Should I choose Mathematics Standard or Basic?',
    answer:
      'Choose Standard (041) if you might take Mathematics in Class 11. Basic (241) covers the same chapters with easier questions and is for students who will not continue with Maths.',
  },
  {
    question: 'How much do previous year questions help?',
    answer:
      'A lot. CBSE repeats question styles and frequently tested concepts, especially in case-based and assertion–reason questions. Solve PYQs chapter by chapter, then full papers under a 3-hour timer.',
  },
  {
    question: 'Is NCERT enough for CBSE Class 10?',
    answer:
      'NCERT textbooks are the base for every question in the board paper. Read them thoroughly first, then practise PYQs and sample papers to learn how questions are framed.',
  },
];
