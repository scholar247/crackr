// Illustrative — mock/PYP/MCQ volume isn't tracked per exam in the DB yet. Shared
// between the exams catalog (/exams) and the homepage's exam grid so both surfaces
// stay in sync rather than drifting out of sync copies.
export const EXAM_STATS: Record<string, { mocks: string; pyp: string; mcqs: string }> = {
  nimcet: { mocks: '120+', pyp: '15 Yrs', mcqs: '5K+' },
  'bhu-mca': { mocks: '60+', pyp: '8 Yrs', mcqs: '2K+' },
  'gate-cse': { mocks: '150+', pyp: '10 Yrs', mcqs: '12K+' },
  'gate-ece': { mocks: '100+', pyp: '10 Yrs', mcqs: '8K+' },
  'jee-main': { mocks: '200+', pyp: '20 Yrs', mcqs: '20K+' },
  'jee-advanced': { mocks: '150+', pyp: '15 Yrs', mcqs: '15K+' },
  upsee: { mocks: '80+', pyp: '12 Yrs', mcqs: '6K+' },
  'neet-ug': { mocks: '180+', pyp: '18 Yrs', mcqs: '18K+' },
  'aiims-ug': { mocks: '90+', pyp: '10 Yrs', mcqs: '7K+' },
  'jipmer-ug': { mocks: '70+', pyp: '8 Yrs', mcqs: '5K+' },
  'cuet-ug': { mocks: '100+', pyp: '4 Yrs', mcqs: '10K+' },
  'cbse-class-12-board': { mocks: '60+', pyp: '10 Yrs', mcqs: '8K+' },
  'cbse-class-10-board': { mocks: '50+', pyp: '10 Yrs', mcqs: '6K+' },
};
export const DEFAULT_EXAM_STATS = { mocks: '50+', pyp: '5 Yrs', mcqs: '3K+' };

export interface ExamCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  initials: string;
  stats: { mocks: string; pyp: string; mcqs: string };
  /** Real syllabus-tree subject count (not illustrative) — optional since only the
   * /exams landing page's "Subjects" stat currently uses it. */
  subjectCount?: number;
}

export function computeExamInitials(name: string, takenInGroup: Set<string>): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  let initials = words[0].slice(0, 2).toUpperCase();
  if (takenInGroup.has(initials) && words.length > 1) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  }
  takenInGroup.add(initials);
  return initials;
}

// Illustrative — eligibility/core-subjects/duration aren't tracked in the DB. Covers the
// well-known exam slugs also present in EXAM_STATS; anything else falls back to
// DEFAULT_EXAM_COMPARISON.
export const EXAM_COMPARISON: Record<string, { eligibility: string; coreSubjects: string; duration: string }> = {
  nimcet: {
    eligibility: 'B.Sc/B.Voc (Hons)/BCA/BIT with Maths/Stats 3 yrs course',
    coreSubjects: 'Mathematics, Analytical Ability & Logical Reasoning, Computer Awareness, English',
    duration: '2 Hours (120 mins)',
  },
  'cuet-ug': {
    eligibility: "Bachelor's degree with minimum 50% marks (varies by university)",
    coreSubjects: 'Language Comprehension, General Knowledge, Computer Basics, Logical Reasoning',
    duration: '1 Hour 45 mins (105 mins)',
  },
  'gate-cse': {
    eligibility: 'Currently in 3rd year or higher of any UG degree program',
    coreSubjects: 'Engineering Mathematics, Digital Logic, COA, Programming & DS, Algorithms',
    duration: '3 Hours (180 mins)',
  },
  'jee-main': {
    eligibility: 'Class 12 pass with Physics, Chemistry, Mathematics',
    coreSubjects: 'Physics, Chemistry, Mathematics',
    duration: '3 Hours (180 mins)',
  },
  'neet-ug': {
    eligibility: 'Class 12 pass with Physics, Chemistry, Biology',
    coreSubjects: 'Physics, Chemistry, Biology',
    duration: '3 Hours 20 mins (200 mins)',
  },
};
export const DEFAULT_EXAM_COMPARISON = {
  eligibility: 'Varies — see exam page for details',
  coreSubjects: 'Subject-specific — see syllabus',
  duration: 'Varies by exam',
};
