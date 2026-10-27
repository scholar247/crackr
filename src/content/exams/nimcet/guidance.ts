// SyllabuzAI's own preparation advice for NIMCET. Nothing here is official: pages that show
// this content label it as a recommendation. Numbers quoted here are derived from the
// official 2026 pattern in official.ts (e.g. seconds per question), never invented.

export const NIMCET_PATH = '/exams/nimcet';
const EXAM_PATH = NIMCET_PATH;

/** The loop every chapter page pushes the student through. */
export const CHAPTER_LOOP = ['Learn the concepts', 'Solve practice questions', 'Take a timed chapter test', 'Review your mistakes', 'Revise'] as const;

// ── Subject-level guidance ───────────────────────────────────────────────────

export interface SubjectGuidance {
  /** One line on why this subject matters, derived from the official pattern. */
  weight: string;
  pace: string;
  approach: string[];
}

export const SUBJECT_GUIDANCE: Record<string, SubjectGuidance> = {
  mathematics: {
    weight: '600 of 1000 marks (60%). Mathematics also breaks ties, and a zero or negative score here disqualifies you.',
    pace: '50 questions in 70 minutes: about 84 seconds per question.',
    approach: [
      'Spend the most hours here. Calculus, algebra and coordinate geometry are the largest units in the syllabus.',
      'A wrong answer costs 3 marks, so learn to drop a question early rather than after three minutes of work.',
      'Keep a formula sheet per unit and revise it weekly. Speed in Part I comes from recall, not re-derivation.',
      'Mix units in practice once each is done. The paper does not group questions by chapter.',
    ],
  },
  'logical-reasoning': {
    weight: '240 of 1000 marks (24%), and the second tie-breaker.',
    pace: '40 questions in 30 minutes: about 45 seconds per question.',
    approach: [
      'This part is a speed test. Practise in timed sets of 10 questions in 7–8 minutes from the start.',
      'Learn a fixed method for each question type (blood relations, directions, seating) so you are not inventing one in the exam.',
      'Skip long puzzles and data sets on the first pass and come back if time allows.',
    ],
  },
  'computer-awareness': {
    weight: '120 of 1000 marks (12%), and the third tie-breaker.',
    pace: 'Shares a 20-minute part with English: 30 questions, about 40 seconds each.',
    approach: [
      'Data representation and Boolean algebra are calculation-based. Practise conversions until they take under 30 seconds.',
      'Hardware, software and internet topics are factual. Short daily revision works better than one long session.',
      'Because the part is short, answer the questions you know first and leave lengthy conversions for the end.',
    ],
  },
  'general-english': {
    weight: '40 of 1000 marks (4%).',
    pace: 'Shares Part III with Computer Awareness. Aim to finish English in about 6–7 minutes.',
    approach: [
      'Read one editorial or technical article a day to keep comprehension speed up.',
      'Keep a running list of new words and phrases, with an example sentence for each.',
      'Spend limited time here. A steady score is enough; Maths and Reasoning carry far more marks.',
    ],
  },
};

// ── Unit-level tips, keyed `${subjectSlug}/${unitSlug}` ──────────────────────

export const UNIT_TIPS: Record<string, string[]> = {
  'mathematics/set-theory-and-logic': [
    'Draw a Venn diagram for every counting question, even simple ones.',
    'Build truth tables for implications and biconditionals until you can write them from memory.',
  ],
  'mathematics/probability-and-statistics': [
    'Write the sample space before calculating. Most errors come from miscounting it.',
    "For Bayes' theorem questions, draw a tree of the cases first.",
    'Learn how mean, variance and standard deviation change when data is shifted or scaled.',
  ],
  'mathematics/algebra': [
    'Roots-and-coefficients relations solve many quadratic questions without finding the roots.',
    'For permutations and combinations, decide first whether order matters, then whether repetition is allowed.',
    'Practise determinant properties; they turn long expansions into one-line answers.',
  ],
  'mathematics/coordinate-geometry': [
    'Memorise the standard forms of each conic with its focus, directrix and tangent condition.',
    'Sketch the figure. Many questions can be checked against a rough diagram.',
  ],
  'mathematics/calculus': [
    'Know the standard limits and derivative results by heart.',
    'For definite integrals, check for odd, even or periodic properties before integrating.',
    'Area questions: sketch the curves and find the intersection points first.',
  ],
  'mathematics/trigonometry': [
    'Learn the principal value ranges of each inverse trigonometric function.',
    'For heights and distances, draw the figure and label every angle before writing equations.',
  ],
  'logical-reasoning/verbal-and-non-verbal-reasoning': [
    'Use a family-tree notation for blood relations and a compass sketch for direction tests.',
    'For syllogisms, use Venn diagrams and check every possible case.',
    'Seating arrangements: fix the most certain clue first, then place the rest.',
  ],
  'logical-reasoning/problem-solving-and-data': [
    'For data interpretation, read the question before the chart so you only extract what you need.',
    'Round numbers sensibly. Options are usually far enough apart.',
    'In data sufficiency, test each statement alone before combining them.',
  ],
  'computer-awareness/computer-basics': [
    'Learn the memory hierarchy in order of speed and cost.',
    'Know what each part of the CPU does and the basic instruction cycle.',
  ],
  'computer-awareness/data-representation': [
    "Practise binary, octal and hexadecimal conversions and two's complement daily until they are quick.",
    'Simplify Boolean expressions with the basic laws before reaching for a K-map.',
  ],
  'computer-awareness/computer-hardware': [
    'Group devices by role (input, output, storage, memory) and know one or two examples of each.',
  ],
  'computer-awareness/computer-software': [
    'Be clear on the difference between system software, utilities, drivers and application software.',
  ],
  'computer-awareness/internet-and-email': [
    'Know common internet terms (browser, URL, DNS, protocol) and common threats such as phishing and malware.',
  ],
  'general-english/comprehension': ['Skim the questions first, then read the passage looking for those answers.'],
  'general-english/vocabulary': ['Learn words in context, with synonyms and antonyms, rather than as isolated lists.'],
  'general-english/grammar-and-usage': ['Revise subject-verb agreement, tenses, articles and prepositions: the most common error-spotting areas.'],
};

// ── Preparation strategy ─────────────────────────────────────────────────────

export interface StrategyPhase {
  title: string;
  share: string;
  goals: string[];
}

export const STRATEGY_PHASES: StrategyPhase[] = [
  {
    title: 'Understand the exam',
    share: 'First few days',
    goals: [
      'Check that you meet the eligibility criteria.',
      'Read the official syllabus and the test pattern, especially the fixed time for each part.',
      'Note how much each subject is worth: Mathematics alone is 60% of the marks.',
    ],
  },
  {
    title: 'Build the foundation',
    share: 'About 40% of your time',
    goals: [
      'Go unit by unit through Mathematics, solving practice questions after each unit.',
      'Learn a method for each reasoning question type.',
      'Cover Computer Awareness and English in short daily sessions alongside.',
    ],
  },
  {
    title: 'Practise and test',
    share: 'About 35% of your time',
    goals: [
      'Take a timed chapter test after finishing each unit.',
      'Move to mixed practice across units.',
      'Start full-length mocks that follow the official three-part timing.',
    ],
  },
  {
    title: 'Revise and refine',
    share: 'About 25% of your time',
    goals: [
      'Review every wrong answer and note why it went wrong: concept, calculation, or time.',
      'Revisit weak units, then retest them.',
      'Take mocks at the same time of day as the exam to build stamina.',
    ],
  },
];

export const PREP_PRINCIPLES = [
  { title: 'Weight your hours by marks', detail: 'Mathematics is 600 of 1000 marks. Give it most of your study time, but do not neglect Reasoning (240).' },
  { title: 'Practise inside the time limits', detail: 'Each part has a fixed time and you cannot switch parts, so practise each part against its own clock.' },
  { title: 'Treat wrong answers as a cost', detail: 'A wrong answer costs 25% of the question’s marks. Accuracy matters as much as attempts.' },
  { title: 'Review, don’t just repeat', detail: 'A mock is only useful if you go through every mistake afterwards and fix its cause.' },
];

// ── Study plans: configurable durations, not official requirements ───────────

export interface PlanTask {
  label: string;
  href: string;
}

export interface PlanBlock {
  days: string;
  title: string;
  tasks: PlanTask[];
}

export interface StudyPlan {
  days: 30 | 60 | 90;
  label: string;
  for: string;
  hoursPerDay: string;
  blocks: PlanBlock[];
}

const unit = (subject: string, slug: string) => `${EXAM_PATH}/${subject}/${slug}`;
const subj = (subject: string) => `${EXAM_PATH}/${subject}`;

export const STUDY_PLANS: StudyPlan[] = [
  {
    days: 30,
    label: '30-day revision plan',
    for: 'Students who have already covered most of the syllabus and need focused revision.',
    hoursPerDay: '5–6 hours',
    blocks: [
      {
        days: 'Days 1–7',
        title: 'Mathematics revision',
        tasks: [
          { label: 'Revise Algebra and Calculus', href: unit('mathematics', 'algebra') },
          { label: 'Revise Coordinate Geometry and Trigonometry', href: unit('mathematics', 'coordinate-geometry') },
          { label: 'Timed reasoning sets every day', href: subj('logical-reasoning') },
        ],
      },
      {
        days: 'Days 8–14',
        title: 'Remaining units',
        tasks: [
          { label: 'Probability and Statistics, Set Theory and Logic', href: unit('mathematics', 'probability-and-statistics') },
          { label: 'Data Representation and Boolean algebra', href: unit('computer-awareness', 'data-representation') },
          { label: 'English: comprehension and vocabulary', href: subj('general-english') },
        ],
      },
      {
        days: 'Days 15–24',
        title: 'Full-length mocks',
        tasks: [
          { label: 'One full mock every two days', href: `${EXAM_PATH}/mock-tests` },
          { label: 'Review every mistake the next day', href: `${EXAM_PATH}/practice` },
        ],
      },
      {
        days: 'Days 25–30',
        title: 'Final revision',
        tasks: [
          { label: 'Formula sheets and weak units only', href: `${EXAM_PATH}/syllabus` },
          { label: 'Re-read the exam rules and timing', href: `${EXAM_PATH}/exam-pattern` },
        ],
      },
    ],
  },
  {
    days: 60,
    label: '60-day plan',
    for: 'Students who know the basics and want to cover the full syllabus once, with mocks.',
    hoursPerDay: '4–5 hours',
    blocks: [
      {
        days: 'Days 1–20',
        title: 'Mathematics core',
        tasks: [
          { label: 'Algebra', href: unit('mathematics', 'algebra') },
          { label: 'Calculus', href: unit('mathematics', 'calculus') },
          { label: 'Coordinate Geometry', href: unit('mathematics', 'coordinate-geometry') },
          { label: 'Reasoning: 30 minutes of timed practice daily', href: subj('logical-reasoning') },
        ],
      },
      {
        days: 'Days 21–35',
        title: 'Remaining Mathematics and Computer Awareness',
        tasks: [
          { label: 'Trigonometry', href: unit('mathematics', 'trigonometry') },
          { label: 'Probability and Statistics', href: unit('mathematics', 'probability-and-statistics') },
          { label: 'Set Theory and Logic', href: unit('mathematics', 'set-theory-and-logic') },
          { label: 'All Computer Awareness units', href: subj('computer-awareness') },
        ],
      },
      {
        days: 'Days 36–50',
        title: 'Mocks and weak areas',
        tasks: [
          { label: 'Two full mocks a week', href: `${EXAM_PATH}/mock-tests` },
          { label: 'Fix weak units with targeted practice', href: `${EXAM_PATH}/practice` },
          { label: 'English: one passage and ten words a day', href: subj('general-english') },
        ],
      },
      {
        days: 'Days 51–60',
        title: 'Revision',
        tasks: [
          { label: 'Revise formulas and methods', href: `${EXAM_PATH}/syllabus` },
          { label: 'One final mock with the exact part timings', href: `${EXAM_PATH}/exam-pattern` },
        ],
      },
    ],
  },
  {
    days: 90,
    label: '90-day plan',
    for: 'Students starting from scratch, or working alongside college.',
    hoursPerDay: '3–4 hours',
    blocks: [
      {
        days: 'Days 1–15',
        title: 'Foundations',
        tasks: [
          { label: 'Set Theory and Logic', href: unit('mathematics', 'set-theory-and-logic') },
          { label: 'Algebra', href: unit('mathematics', 'algebra') },
          { label: 'Computer Basics', href: unit('computer-awareness', 'computer-basics') },
        ],
      },
      {
        days: 'Days 16–35',
        title: 'Calculus and geometry',
        tasks: [
          { label: 'Calculus', href: unit('mathematics', 'calculus') },
          { label: 'Coordinate Geometry', href: unit('mathematics', 'coordinate-geometry') },
          { label: 'Verbal and non-verbal reasoning', href: unit('logical-reasoning', 'verbal-and-non-verbal-reasoning') },
        ],
      },
      {
        days: 'Days 36–55',
        title: 'Complete the syllabus',
        tasks: [
          { label: 'Trigonometry', href: unit('mathematics', 'trigonometry') },
          { label: 'Probability and Statistics', href: unit('mathematics', 'probability-and-statistics') },
          { label: 'Problem solving and data', href: unit('logical-reasoning', 'problem-solving-and-data') },
          { label: 'Remaining Computer Awareness units', href: subj('computer-awareness') },
        ],
      },
      {
        days: 'Days 56–75',
        title: 'Practice and chapter tests',
        tasks: [
          { label: 'A timed chapter test for every unit', href: `${EXAM_PATH}/mock-tests` },
          { label: 'Mixed practice across subjects', href: `${EXAM_PATH}/practice` },
          { label: 'English: comprehension and grammar', href: subj('general-english') },
        ],
      },
      {
        days: 'Days 76–90',
        title: 'Mocks and revision',
        tasks: [
          { label: 'Two to three full mocks a week', href: `${EXAM_PATH}/mock-tests` },
          { label: 'Revise weak units', href: `${EXAM_PATH}/syllabus` },
        ],
      },
    ],
  },
];

export const DAILY_ROUTINE = [
  { slot: 'Main block', task: 'Mathematics: one unit, concepts then practice questions' },
  { slot: 'Speed block', task: 'Reasoning: a timed set of 10 questions in 7–8 minutes' },
  { slot: 'Short block', task: 'Computer Awareness or English: 20–30 minutes' },
  { slot: 'Review', task: 'Go through the day’s mistakes and note why each happened' },
];

export const WEEKLY_GOALS = [
  'Finish the units planned for the week.',
  'Take at least one timed chapter test or full mock.',
  'Re-attempt the questions you got wrong last week.',
  'Revise formula sheets for completed units.',
];
