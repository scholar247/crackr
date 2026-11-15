import type { CbseBoard, CbseSubjectKey } from './types';

// Editorial content for the CBSE Class 12 landing. Review every academic session.

const KEY_BY_SLUG: Record<string, CbseSubjectKey> = {
  physics: 'physics',
  chemistry: 'chemistry',
  mathematics: 'maths',
  biology: 'biology',
  english: 'english',
  economics: 'economics',
  'business-studies': 'business-studies',
  'computer-science': 'computer-science',
};

function subjectKeyFor(slug: string): CbseSubjectKey | null {
  const base = slug.replace(/-class-12$/, '');
  return KEY_BY_SLUG[base] ?? null;
}

export const CBSE_CLASS_12: CbseBoard = {
  examSlug: 'cbse-class-12-board',
  label: 'CBSE Class 12',
  shortLabel: 'Class 12',
  session: '2026–27',
  /**
   * Expected start of the 2027 board exams. CBSE hasn't released the date sheet yet; in
   * recent years Class 12 papers have started in mid-February (10:30 am IST) and run into
   * early April, so this is shown as an estimate.
   */
  boardExam: { startsOn: '2027-02-17T10:30:00+05:30', isTentative: true, label: 'Board exams' },
  coreSubjects: 'Physics, Chemistry, Mathematics, Biology, English and Commerce subjects',
  heroDescription:
    'Chapter-wise syllabus, practice MCQs, notes, mock tests, official sample papers and the latest CBSE notifications for Physics, Chemistry, Maths, Biology, English, Economics, Business Studies and Computer Science.',
  keyFacts: [
    { label: 'Board exams', value: 'Mid-February to early April 2027 (expected)' },
    { label: 'Marks per subject', value: '70 theory + 30 practical, or 80 + 20 project' },
    { label: 'Pass mark', value: '33% in theory and practical separately' },
    { label: 'Supplementary exam', value: 'July — for compartment or improving one subject' },
  ],
  patternIntro:
    'Subjects with lab work (Physics, Chemistry, Biology, Computer Science) have a 70-mark theory paper and 30 practical marks; the rest have an 80-mark paper and 20 marks of internal assessment or project work.',
  // Section structure per the CBSE 2025–26 sample question papers.
  patterns: {
    physics: {
      theoryMarks: 70,
      internalMarks: 30,
      internalLabel: 'practical',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: '16 MCQs incl. 4 assertion–reason (1 mark each)', marks: 16 },
        { name: 'B', questionType: '5 very short answers (2 marks each)', marks: 10 },
        { name: 'C', questionType: '7 short answers (3 marks each)', marks: 21 },
        { name: 'D', questionType: '2 case-based questions (4 marks each)', marks: 8 },
        { name: 'E', questionType: '3 long answers (5 marks each)', marks: 15 },
      ],
    },
    chemistry: {
      theoryMarks: 70,
      internalMarks: 30,
      internalLabel: 'practical',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: '16 MCQs incl. assertion–reason (1 mark each)', marks: 16 },
        { name: 'B', questionType: '5 very short answers (2 marks each)', marks: 10 },
        { name: 'C', questionType: '7 short answers (3 marks each)', marks: 21 },
        { name: 'D', questionType: '2 case-based questions (4 marks each)', marks: 8 },
        { name: 'E', questionType: '3 long answers (5 marks each)', marks: 15 },
      ],
    },
    maths: {
      theoryMarks: 80,
      internalMarks: 20,
      internalLabel: 'internal assessment',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: '18 MCQs + 2 assertion–reason (1 mark each)', marks: 20 },
        { name: 'B', questionType: '5 very short answers (2 marks each)', marks: 10 },
        { name: 'C', questionType: '6 short answers (3 marks each)', marks: 18 },
        { name: 'D', questionType: '4 long answers (5 marks each)', marks: 20 },
        { name: 'E', questionType: '3 case-based questions (4 marks each)', marks: 12 },
      ],
    },
    biology: {
      theoryMarks: 70,
      internalMarks: 30,
      internalLabel: 'practical',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: '16 MCQs incl. assertion–reason (1 mark each)', marks: 16 },
        { name: 'B', questionType: '5 very short answers (2 marks each)', marks: 10 },
        { name: 'C', questionType: '7 short answers (3 marks each)', marks: 21 },
        { name: 'D', questionType: '2 case-based questions (4 marks each)', marks: 8 },
        { name: 'E', questionType: '3 long answers (5 marks each)', marks: 15 },
      ],
    },
    english: {
      theoryMarks: 80,
      internalMarks: 20,
      internalLabel: 'internal assessment',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: 'Reading — unseen passages and case-based passage', marks: 22 },
        { name: 'B', questionType: 'Creative writing (notice, invitation, letter, article)', marks: 18 },
        { name: 'C', questionType: 'Literature — Flamingo and Vistas', marks: 40 },
      ],
    },
    economics: {
      theoryMarks: 80,
      internalMarks: 20,
      internalLabel: 'project',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: 'Macroeconomics — MCQs, 3, 4 and 6-mark answers', marks: 40 },
        { name: 'B', questionType: 'Indian Economic Development — MCQs, 3, 4 and 6-mark answers', marks: 40 },
      ],
    },
    'business-studies': {
      theoryMarks: 80,
      internalMarks: 20,
      internalLabel: 'project',
      durationHours: 3,
      sections: [
        { name: '1', questionType: '20 MCQs (1 mark each)', marks: 20 },
        { name: '2', questionType: '4 short answers (3 marks each)', marks: 12 },
        { name: '3', questionType: '6 short answers (4 marks each)', marks: 24 },
        { name: '4', questionType: '4 long answers (6 marks each)', marks: 24 },
      ],
    },
    'computer-science': {
      theoryMarks: 70,
      internalMarks: 30,
      internalLabel: 'practical',
      durationHours: 3,
      sections: [
        { name: 'A', questionType: '21 objective questions (1 mark each)', marks: 21 },
        { name: 'B', questionType: '7 very short answers (2 marks each)', marks: 14 },
        { name: 'C', questionType: '3 short answers (3 marks each)', marks: 9 },
        { name: 'D', questionType: '4 case/source-based questions (4 marks each)', marks: 16 },
        { name: 'E', questionType: '2 long answers (5 marks each)', marks: 10 },
      ],
      note: 'Practical marks cover a Python and SQL lab test, practical file, project and viva.',
    },
  },
  patternHighlights: [
    { label: 'Theory paper', value: '70 or 80 marks', detail: '3 hours, one paper per subject' },
    { label: 'Practical / project', value: '30 or 20 marks', detail: 'Lab exam, practical file, project and viva' },
    { label: 'To pass', value: '33%', detail: 'In theory and practical separately' },
    { label: 'Competency-based', value: '~50%', detail: 'Case-based, source-based, application questions' },
  ],
  patternSource: 'Based on the CBSE 2025–26 sample question papers. Check the official sample papers for your session before the exam.',
  roadmap: [
    {
      id: 'foundation',
      title: 'Build the foundation',
      window: 'April – September',
      months: [4, 5, 6, 7, 8, 9],
      focus: ['Read every NCERT chapter and solve all exercises', 'Keep a formula, reaction and derivation notebook', 'Keep your practical file up to date'],
    },
    {
      id: 'complete',
      title: 'Finish the syllabus',
      window: 'October – November',
      months: [10, 11],
      focus: ['Close pending chapters', 'Chapter-wise PYQs after each chapter', 'Finish projects before pre-boards'],
    },
    {
      id: 'pre-boards',
      title: 'Practicals, pre-boards & sample papers',
      window: 'December – January',
      months: [12, 1],
      focus: ['Prepare for practical exams and viva', 'Timed full papers every week', 'Solve the latest CBSE sample papers'],
    },
    {
      id: 'boards',
      title: 'Board exams',
      window: 'February – April',
      months: [2, 3, 4],
      focus: ['Revise derivations, diagrams and reactions', 'Use the gaps between papers for one subject at a time', 'Sleep well — timing matters more than cramming'],
    },
    {
      id: 'after-boards',
      title: 'Results & next steps',
      window: 'May – July',
      months: [5, 6],
      focus: ['Entrance exams (JEE, NEET, CUET) if you are taking them', 'Results are usually out in May', 'Supplementary exam in July if you need it'],
    },
  ],
  faqs: [
    {
      question: 'What are the passing marks for CBSE Class 12?',
      answer:
        'You need at least 33% in each subject. In subjects with practicals (such as Physics, Chemistry, Biology and Computer Science) you must score 33% separately in the theory paper and in the practical.',
    },
    {
      question: 'How are marks split between theory and practicals?',
      answer:
        'Physics, Chemistry, Biology and Computer Science have a 70-mark theory paper and 30 practical marks. Mathematics, English, Economics and Business Studies have an 80-mark paper and 20 marks for internal assessment or a project.',
    },
    {
      question: 'Is there a second board exam for Class 12?',
      answer:
        'No. The two-exam system introduced in 2026 applies to Class 10 only. Class 12 students placed in compartment can take the supplementary exam in July, which also lets students who passed try to improve their marks in one subject.',
    },
    {
      question: 'Do Class 12 board marks matter for JEE, NEET and CUET?',
      answer:
        'Yes, in different ways. Admission to NITs, IIITs and other centrally funded institutes through JEE Main needs 75% in Class 12 (65% for SC/ST) or a place in the top 20 percentile of your board. NEET and CUET admissions are based on the entrance score, but you must pass Class 12 with the required subjects.',
    },
    {
      question: 'Is NCERT enough for CBSE Class 12?',
      answer:
        'NCERT textbooks are the base for every board question, including the examples and in-text questions. Master them first, then practise PYQs and the latest sample papers to learn how questions are framed and marked.',
    },
  ],
  subjectKeyFor,
  shortSubjectName: (name) => name.replace(/\s*\(class\s*12\)\s*$/i, ''),
};
