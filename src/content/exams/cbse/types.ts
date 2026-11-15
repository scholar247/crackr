// Shape of the editorial content behind a CBSE board landing (Class 10, Class 12): the
// parts that don't live in the database — paper pattern, dates, roadmap, FAQs. Each class
// has its own file next to this one; review both every academic session (CBSE publishes
// the date sheet around December and new sample question papers each year).

export type CbseSubjectKey =
  | 'maths'
  | 'science'
  | 'social-science'
  | 'english'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'economics'
  | 'business-studies'
  | 'computer-science';

export interface PaperSection {
  name: string;
  questionType: string;
  marks: number;
}

export interface SubjectPattern {
  theoryMarks: number;
  internalMarks: number;
  /** What the non-theory marks are for: "internal assessment", "practical", "project". */
  internalLabel: string;
  durationHours: number;
  sections: PaperSection[];
  note?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  window: string;
  /** Months (1–12) this phase covers — used to highlight where the student is today. */
  months: number[];
  focus: string[];
}

export interface Faq {
  question: string;
  answer: string;
}

export interface CbseBoard {
  examSlug: string;
  /** "CBSE Class 10" — used in titles and headings. */
  label: string;
  /** "Class 10" — used where CBSE is already obvious. */
  shortLabel: string;
  session: string;
  boardExam: { startsOn: string; isTentative: boolean; label: string };
  /** "Maths, Science, Social Science and English" — the core subjects, for copy. */
  coreSubjects: string;
  heroDescription: string;
  /** Quick facts for the "exam at a glance" card on the home page. */
  keyFacts: { label: string; value: string }[];
  patterns: Partial<Record<CbseSubjectKey, SubjectPattern>>;
  patternIntro: string;
  patternHighlights: { label: string; value: string; detail: string }[];
  patternSource: string;
  roadmap: RoadmapPhase[];
  faqs: Faq[];
  /** Maps a syllabus subject slug (e.g. "mathematics-class-10") to its editorial key. */
  subjectKeyFor: (slug: string) => CbseSubjectKey | null;
  /** Display name for a syllabus subject: "Mathematics (Class 10)" → "Mathematics". */
  shortSubjectName: (name: string) => string;
}

/** The roadmap phase for a given date, by month in IST (the audience's calendar). */
export function currentPhase(roadmap: RoadmapPhase[], now = new Date()): RoadmapPhase {
  const istMonth = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCMonth() + 1;
  // Later phases win where months overlap (e.g. May: new session vs. second exam) — the
  // later one is the more urgent.
  return [...roadmap].reverse().find((p) => p.months.includes(istMonth)) ?? roadmap[0];
}
