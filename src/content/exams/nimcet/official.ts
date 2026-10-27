// Official NIMCET facts, transcribed from the coordinating institute's documents. Everything
// here is year-bound: when the next brochure is published, add a new cycle object rather
// than editing this one, and point CURRENT_CYCLE at it. Nothing in this file is advice —
// SyllabuzAI's own recommendations live in guidance.ts.

export interface OfficialSource {
  label: string;
  url: string;
  /** When SyllabuzAI last checked this source against what the pages say. */
  checkedOn: string;
}

export const OFFICIAL_SITE = 'https://nimcet.admissions.nic.in/';

export const SOURCES = {
  site: { label: 'NIMCET official website', url: OFFICIAL_SITE, checkedOn: '2026-10-25' },
  brochure2026: {
    label: 'NIMCET 2026 Information Brochure',
    url: 'https://nimcet.admissions.nic.in/document/information-brochure-2026/',
    checkedOn: '2026-10-25',
  },
  syllabus2026: {
    label: 'Revised syllabus of NIMCET (2026 onwards)',
    url: 'https://nimcet.admissions.nic.in/document/revised-syllabus-of-nimcet-2026-onwards/',
    checkedOn: '2026-10-25',
  },
  institutes: { label: 'Participating institutes', url: 'https://nimcet.admissions.nic.in/institutes/', checkedOn: '2026-10-25' },
  seatMatrix: { label: 'Seat matrix', url: 'https://nimcet.admissions.nic.in/seat-matrix/', checkedOn: '2026-10-25' },
  schedule: { label: 'Schedule', url: 'https://nimcet.admissions.nic.in/schedule/', checkedOn: '2026-10-25' },
} satisfies Record<string, OfficialSource>;

// ── Test pattern ─────────────────────────────────────────────────────────────

export interface PatternPart {
  part: 'I' | 'II' | 'III';
  minutes: number;
  /** Clock time in the 2026 sitting. */
  slot: string;
  sections: { subjectSlug: string; name: string; questions: number; correct: number; wrong: number; totalMarks: number }[];
}

export const PATTERN = {
  year: 2026,
  source: SOURCES.brochure2026,
  mode: 'Online, computer-based test (CBT)',
  language: 'English only',
  durationMinutes: 120,
  totalQuestions: 120,
  totalMarks: 1000,
  optionsPerQuestion: 4,
  negativeRule: 'Each wrong answer costs 25% of that question’s marks. Unanswered questions cost nothing.',
  parts: [
    {
      part: 'I',
      minutes: 70,
      slot: '2:00 PM – 3:10 PM',
      sections: [{ subjectSlug: 'mathematics', name: 'Mathematics', questions: 50, correct: 12, wrong: 3, totalMarks: 600 }],
    },
    {
      part: 'II',
      minutes: 30,
      slot: '3:10 PM – 3:40 PM',
      sections: [
        { subjectSlug: 'logical-reasoning', name: 'Analytical Ability & Logical Reasoning', questions: 40, correct: 6, wrong: 1.5, totalMarks: 240 },
      ],
    },
    {
      part: 'III',
      minutes: 20,
      slot: '3:40 PM – 4:00 PM',
      sections: [
        { subjectSlug: 'computer-awareness', name: 'Computer Awareness', questions: 20, correct: 6, wrong: 1.5, totalMarks: 120 },
        { subjectSlug: 'general-english', name: 'General English', questions: 10, correct: 4, wrong: 1, totalMarks: 40 },
      ],
    },
  ] satisfies PatternPart[],
  rules: [
    'The three parts appear one after the other, and the time for each part is fixed.',
    'You cannot move back to an earlier part, or ahead to the next one, during the test.',
    'Calculators, mobile phones, smart watches and other electronic gadgets are not allowed.',
    'A separate sheet is given for rough work.',
  ],
};

export const QUALIFYING = {
  source: SOURCES.brochure2026,
  disqualification: 'A candidate scoring zero or negative marks in Mathematics, or in the total, is disqualified.',
  ranking: 'Ranks are based on the total of marks across the four subjects, out of 1000.',
  tieBreakers: [
    'Higher marks in Mathematics.',
    'Higher marks in Analytical Ability & Logical Reasoning.',
    'Higher marks in Computer Awareness.',
    'The older candidate is preferred.',
    'Random sampling by computer.',
  ],
};

// ── Eligibility ──────────────────────────────────────────────────────────────

export const ELIGIBILITY = {
  year: 2026,
  source: SOURCES.brochure2026,
  nationality: 'Indian nationals',
  minimumScore: [
    { category: 'General, OBC and EWS', requirement: 'At least 60% aggregate, or 6.5 CGPA on a 10-point scale' },
    { category: 'SC, ST and PwD', requirement: 'At least 55% aggregate, or 6.0 CGPA on a 10-point scale' },
  ],
  qualifyingDegrees: [
    'Any undergraduate programme of at least three years with Mathematics or Statistics as one of the subjects',
    'B.E. / B.Tech. from a recognised university or institution',
  ],
  notes: [
    'Marks are counted across all subjects in all years, including languages, optional and additional subjects.',
    'CGPA and percentage cannot be converted into each other. A CGPA on a scale other than 10 is converted to the 10-point scale proportionally.',
    'Final-year students can apply, with a certificate from their head of institution (Annexure V of the brochure).',
    'For 2026, proof of eligibility had to be submitted at counselling/admission, and no later than 30 September 2026.',
    'Three-year degrees with Mathematics or Statistics from open universities are accepted if the programme is approved by UGC/AICTE and the Distance Education Council.',
    'PwD candidates need a disability of at least 40%.',
  ],
  documents: [
    'Recent passport-size photograph (100–500 KB)',
    'Signature in royal blue or black ink (100–500 KB)',
    'Proof of identity: passport, PAN, voter ID, driving licence or first page of bank passbook',
    'Class 10 certificate or birth certificate',
    'Graduation mark sheets, or the final-year certificate (Annexure V)',
    'Category certificate and PwD certificate, if applicable',
  ],
};

export const APPLICATION_FEE_2026 = {
  source: SOURCES.brochure2026,
  rows: [
    { category: 'General, General-EWS, OBC', fee: 2500 },
    { category: 'SC, ST, PwD (any category)', fee: 1250 },
  ],
};

// ── Dates: the 2026 cycle has finished; 2027 has not been announced ─────────

export interface KeyDate {
  event: string;
  date: string;
}

export const CYCLE_2026 = {
  source: SOURCES.brochure2026,
  coordinatedBy: 'National Institute of Technology, Tiruchirappalli',
  examDate: '2026-06-06',
  examSlot: '2:00 PM – 4:00 PM IST',
  dates: [
    { event: 'Online registration opened', date: '3 March 2026' },
    { event: 'Last date to submit the application', date: '1 May 2026' },
    { event: 'Admit card download', date: '27 May – 6 June 2026' },
    { event: 'Online entrance test', date: '6 June 2026, 2:00–4:00 PM' },
    { event: 'Answer key challenge window', date: '10–11 June 2026' },
    { event: 'Result / score card (tentative)', date: '29 June 2026' },
    { event: 'Counselling registration and choice filling', date: '30 June – 3 July 2026' },
    { event: 'Round 1 seat allotment', date: '6 July 2026' },
    { event: 'Round 2 seat allotment', date: '11 July 2026' },
    { event: 'Round 3 seat allotment', date: '16 July 2026' },
    { event: 'Special round seat allotment', date: '25 July 2026' },
  ] satisfies KeyDate[],
  testCities: [
    'Agartala', 'Ahmedabad', 'Ambala', 'Bhilai', 'Bhopal', 'Bhubaneswar', 'Chennai', 'Cuttack', 'Dhenkanal', 'Guwahati',
    'Haldwani', 'Hyderabad', 'Indore', 'Jaipur', 'Jamshedpur', 'Kanpur', 'Kolkata', 'Kozhikode', 'Lucknow', 'Mangaluru',
    'Mohali', 'Muzaffarpur', 'New Delhi', 'Paschim Medinipur', 'Patna', 'Phagwara', 'Prayagraj', 'Pune', 'Purba Medinipur',
    'Purnia', 'Raipur', 'Ranchi', 'Roorkee', 'Rourkela', 'Shillong', 'Silchar', 'Srinagar', 'Surat', 'Tiruchirappalli',
    'Varanasi', 'Vijayawada', 'Warangal',
  ],
};

/** Shown wherever a date would otherwise appear. Update when the 2027 brochure is out. */
export const NEXT_CYCLE = {
  year: 2027,
  announced: false,
  note: 'NIMCET 2027 dates have not been announced yet. The 2026 test was held on 6 June 2026; check the official website for the 2027 notification.',
};

// ── Participating institutes, seats and fees (2026–27 admissions) ────────────

export interface InstituteProgramme {
  label: string;
  seats: number;
  /** Fee per semester, semesters I–VI, in rupees. */
  semesterFees: number[];
  feeBasis: 'consolidated' | 'tuition only';
  feeNote?: string;
}

export interface Institute {
  slug: string;
  name: string;
  kind: 'NIT' | 'IIIT';
  city: string;
  state: string;
  website: string;
  programmes: InstituteProgramme[];
}

const flat = (fee: number) => Array(6).fill(fee) as number[];

export const INSTITUTES_2026: { year: number; source: OfficialSource; totalSeats: number; institutes: Institute[]; notes: string[] } = {
  year: 2026,
  source: SOURCES.brochure2026,
  totalSeats: 1300,
  institutes: [
    {
      slug: 'nit-agartala', name: 'NIT Agartala', kind: 'NIT', city: 'Agartala', state: 'Tripura', website: 'https://www.nita.ac.in/',
      programmes: [{ label: 'MCA', seats: 60, semesterFees: [56825, 39425, 40625, 39425, 42625, 43925], feeBasis: 'consolidated' }],
    },
    {
      slug: 'mnnit-allahabad', name: 'MNNIT Allahabad', kind: 'NIT', city: 'Prayagraj', state: 'Uttar Pradesh', website: 'https://www.mnnit.ac.in/',
      programmes: [{ label: 'MCA', seats: 116, semesterFees: flat(35000), feeBasis: 'tuition only' }],
    },
    {
      slug: 'manit-bhopal', name: 'MANIT Bhopal', kind: 'NIT', city: 'Bhopal', state: 'Madhya Pradesh', website: 'https://www.manit.ac.in/',
      programmes: [{ label: 'MCA', seats: 115, semesterFees: flat(35000), feeBasis: 'tuition only' }],
    },
    {
      slug: 'nit-delhi', name: 'NIT Delhi', kind: 'NIT', city: 'Delhi', state: 'Delhi', website: 'https://nitdelhi.ac.in/',
      programmes: [
        { label: 'MCA', seats: 10, semesterFees: flat(35000), feeBasis: 'tuition only' },
        { label: 'MCA (self-financing)', seats: 15, semesterFees: flat(100000), feeBasis: 'tuition only' },
      ],
    },
    {
      slug: 'nit-jamshedpur', name: 'NIT Jamshedpur', kind: 'NIT', city: 'Jamshedpur', state: 'Jharkhand', website: 'https://www.nitjsr.ac.in/',
      programmes: [{ label: 'MCA', seats: 115, semesterFees: flat(35000), feeBasis: 'tuition only' }],
    },
    {
      slug: 'nit-kurukshetra', name: 'NIT Kurukshetra', kind: 'NIT', city: 'Kurukshetra', state: 'Haryana', website: 'https://nitkkr.ac.in/',
      programmes: [
        { label: 'MCA', seats: 64, semesterFees: flat(35000), feeBasis: 'tuition only' },
        { label: 'MCA (self-financing)', seats: 42, semesterFees: flat(100000), feeBasis: 'tuition only' },
      ],
    },
    {
      slug: 'nit-meghalaya', name: 'NIT Meghalaya', kind: 'NIT', city: 'Shillong', state: 'Meghalaya', website: 'https://www.nitm.ac.in/',
      programmes: [{ label: 'MCA', seats: 20, semesterFees: flat(35000), feeBasis: 'tuition only' }],
    },
    {
      slug: 'nit-patna', name: 'NIT Patna', kind: 'NIT', city: 'Patna', state: 'Bihar', website: 'https://www.nitp.ac.in/',
      programmes: [
        { label: 'MCA (Data Sciences & Informatics)', seats: 40, semesterFees: flat(50000), feeBasis: 'tuition only' },
        { label: 'MCA (Data Sciences & Informatics, self-financing)', seats: 40, semesterFees: flat(125000), feeBasis: 'tuition only' },
        { label: 'MCA (AI & IoT)', seats: 40, semesterFees: flat(50000), feeBasis: 'tuition only' },
        { label: 'MCA (AI & IoT, self-financing)', seats: 40, semesterFees: flat(125000), feeBasis: 'tuition only' },
      ],
    },
    {
      slug: 'nit-raipur', name: 'NIT Raipur', kind: 'NIT', city: 'Raipur', state: 'Chhattisgarh', website: 'https://www.nitrr.ac.in/',
      programmes: [{ label: 'MCA', seats: 110, semesterFees: flat(35000), feeBasis: 'tuition only' }],
    },
    {
      slug: 'nit-tiruchirappalli', name: 'NIT Tiruchirappalli', kind: 'NIT', city: 'Tiruchirappalli', state: 'Tamil Nadu', website: 'https://www.nitt.edu/',
      programmes: [{ label: 'MCA', seats: 115, semesterFees: flat(35000), feeBasis: 'tuition only', feeNote: 'The brochure says this fee is likely to be revised.' }],
    },
    {
      slug: 'nit-warangal', name: 'NIT Warangal', kind: 'NIT', city: 'Warangal', state: 'Telangana', website: 'https://www.nitw.ac.in/',
      programmes: [{ label: 'MCA', seats: 58, semesterFees: flat(35000), feeBasis: 'tuition only' }],
    },
    {
      slug: 'iiit-bhopal', name: 'IIIT Bhopal', kind: 'IIIT', city: 'Bhopal', state: 'Madhya Pradesh', website: 'https://iiitbhopal.ac.in/',
      programmes: [{ label: 'MCA', seats: 90, semesterFees: flat(121275), feeBasis: 'tuition only' }],
    },
    {
      slug: 'iiit-vadodara', name: 'IIIT Vadodara', kind: 'IIIT', city: 'Gandhinagar / Diu', state: 'Gujarat / Dadra & Nagar Haveli and Daman & Diu', website: 'https://iiitvadodara.ac.in/',
      programmes: [
        { label: 'MCA (Gandhinagar campus)', seats: 120, semesterFees: flat(125000), feeBasis: 'tuition only' },
        { label: 'MCA (International campus, Diu)', seats: 90, semesterFees: flat(125000), feeBasis: 'tuition only' },
      ],
    },
  ],
  notes: [
    'There is no state-wise quota.',
    'SC, ST, OBC, EWS and PwD reservations follow Government of India rules.',
    '“Tuition only” fees exclude hostel and other charges. Check the institute’s website for the full fee.',
  ],
};

export function instituteSeats(i: Institute) {
  return i.programmes.reduce((sum, p) => sum + p.seats, 0);
}

// ── Counselling ──────────────────────────────────────────────────────────────

export const COUNSELLING_2026 = {
  source: SOURCES.brochure2026,
  steps: [
    { title: 'Register and fill choices', detail: 'Qualified candidates register for counselling online, pay the counselling fee and list institutes in order of preference. Choices lock automatically at the deadline.' },
    { title: 'Seat allotment', detail: 'Seats are allotted in rank order, based on your choices and the seats available.' },
    { title: 'Accept the seat', detail: 'After an allotment you pay the seat acceptance fee and pick Freeze (keep this seat), Float (stay in for a better choice in later rounds) or Withdraw.' },
    { title: 'Three general rounds, then a special round', detail: 'Vacant seats after round 3 are published, and a special round with fresh choice filling follows.' },
    { title: 'Report to the institute', detail: 'Allotted candidates report in person to the institute they were finally allotted, on that institute’s schedule, with original documents.' },
  ],
  fees: [
    { label: 'Counselling registration fee (non-refundable)', amount: 1000 },
    { label: 'Seat acceptance fee', amount: 10000 },
  ],
  rankUseNote: 'Some other universities have used NIMCET ranks for their own admissions in past years; NIMCET has no role in those admissions.',
};

export function formatRupees(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}
