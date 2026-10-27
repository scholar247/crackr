import { SOURCES } from './official';

// The official NIMCET syllabus (revised, with effect from 2026). Topic wording follows the
// official document. Mathematics and Computer Awareness are split into units by the document
// itself. For Logical Reasoning and General English the document is a single list, so the
// grouping into units is SyllabuzAI's (flagged by `groupedBy`), but every topic is official.
//
// `nodeSlugs` connect a subject or unit to SyllabuzAI's curriculum nodes (by slug), which is
// how pages find real question counts, practice links and notes. A unit with no matching node
// simply shows no practice yet. Mapping lives here, not in the database, so it can be fixed
// without a migration.

export interface SyllabusUnit {
  slug: string;
  name: string;
  topics: string[];
  nodeSlugs: string[];
}

export interface SyllabusSubject {
  /** URL segment under /exams/nimcet. */
  slug: string;
  name: string;
  shortName: string;
  part: 'I' | 'II' | 'III';
  questions: number;
  summary: string;
  groupedBy: 'official' | 'syllabuzai';
  nodeSlugs: string[];
  units: SyllabusUnit[];
}

export const SYLLABUS_SOURCE = SOURCES.syllabus2026;
export const SYLLABUS_EFFECTIVE_FROM = 2026;

export const SYLLABUS: SyllabusSubject[] = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    shortName: 'Maths',
    part: 'I',
    questions: 50,
    summary: 'Sets and logic, probability and statistics, algebra, coordinate geometry, calculus and trigonometry.',
    groupedBy: 'official',
    nodeSlugs: ['nimcet-mathematics'],
    units: [
      {
        slug: 'set-theory-and-logic',
        name: 'Set Theory and Logic',
        nodeSlugs: ['set-theory'],
        topics: [
          'Concepts of sets: union, intersection, difference, symmetric difference',
          'Cartesian product and cardinality',
          'Functions and relations',
          'Venn diagrams',
          'Truth tables and connectives',
          'Tautology and contradictions',
        ],
      },
      {
        slug: 'probability-and-statistics',
        name: 'Probability and Statistics',
        nodeSlugs: ['probability-and-statistics'],
        topics: [
          'Basic concepts of probability theory',
          'Averages',
          'Dependent and independent events',
          "Bayes' theorem",
          'Mean, median and mode',
          'Mean deviation, standard deviation and variance',
          'Moments',
          'Frequency distributions',
        ],
      },
      {
        slug: 'algebra',
        name: 'Algebra',
        nodeSlugs: ['algebra'],
        topics: [
          'Fundamental operations in algebra',
          'Quadratic equations with real coefficients',
          'Relation between roots and coefficients',
          'Symmetric functions of roots and their sums',
          'Indices, logarithms and exponentials',
          'Arithmetic, geometric and harmonic progressions',
          'Finite sums of powers of natural numbers',
          'Matrices and determinants',
          'Simultaneous linear equations',
          'Permutations and combinations',
          'Binomial theorem',
        ],
      },
      {
        slug: 'coordinate-geometry',
        name: 'Coordinate Geometry',
        nodeSlugs: ['coordinate-geometry-and-vectors'],
        topics: [
          'Rectangular Cartesian coordinates and distance formulae',
          'Section formula',
          'Equation of a line (various forms) and intersection of lines',
          'Pair of straight lines',
          'Equations of a circle, parabola, ellipse and hyperbola',
          'Tangents and normals to circles and conics',
        ],
      },
      {
        slug: 'calculus',
        name: 'Calculus',
        nodeSlugs: ['calculus'],
        topics: [
          'Functions on real numbers',
          'Limits of functions: left and right limits, limits at infinity',
          'Continuous functions and applications of the intermediate value theorem',
          'Differentiation and its applications: tangents, normals',
          'Simple examples of maxima and minima',
          "Applications of Rolle's theorem and the Mean Value Theorem",
          'Integration by parts, by substitution and by partial fractions',
          'Integration of odd, even and periodic functions',
          'Definite integrals and area computations',
        ],
      },
      {
        slug: 'trigonometry',
        name: 'Trigonometry',
        nodeSlugs: ['trigonometry'],
        topics: [
          'Trigonometric functions and identities',
          'Principal values of inverse trigonometric functions',
          'Properties of triangles and solution of triangles',
          'Heights and distances',
          'Trigonometric equations and their general solutions',
        ],
      },
    ],
  },
  {
    slug: 'logical-reasoning',
    name: 'Analytical Ability & Logical Reasoning',
    shortName: 'Reasoning',
    part: 'II',
    questions: 40,
    summary: 'Verbal, non-verbal, deductive and inductive reasoning, plus problem solving and data interpretation.',
    groupedBy: 'syllabuzai',
    nodeSlugs: ['analytical-ability-and-logical-reasoning'],
    units: [
      {
        slug: 'verbal-and-non-verbal-reasoning',
        name: 'Verbal and Non-verbal Reasoning',
        nodeSlugs: ['logical-reasoning', 'number-series-and-coding-decoding'],
        topics: [
          'Verbal reasoning',
          'Non-verbal reasoning',
          'Deductive reasoning',
          'Inductive reasoning',
          'Blood relations',
          'Coding-decoding',
          'Direction test',
          'Seating arrangement',
          'Puzzles',
          'Input-output',
          'Syllogism',
          'Alphanumeric series',
          'Mirror images',
          'Statements and conclusions / arguments',
        ],
      },
      {
        slug: 'problem-solving-and-data',
        name: 'Problem Solving and Data',
        nodeSlugs: ['data-interpretation'],
        topics: ['Problem solving', 'Critical thinking', 'Data interpretation', 'Numerical reasoning', 'Data sufficiency', 'Data visualisation'],
      },
    ],
  },
  {
    slug: 'computer-awareness',
    name: 'Computer Awareness',
    shortName: 'Computers',
    part: 'III',
    questions: 20,
    summary: 'Computer organisation, data representation and Boolean algebra, hardware, software, and the internet.',
    groupedBy: 'official',
    nodeSlugs: ['computer-awareness'],
    units: [
      {
        slug: 'computer-basics',
        name: 'Computer Basics',
        nodeSlugs: ['computer-fundamentals'],
        topics: [
          'Organisation of a computer',
          'Central Processing Unit (CPU)',
          'Structure of instructions in the CPU',
          'Input/output devices',
          'Computer memory',
          'Back-up devices',
        ],
      },
      {
        slug: 'data-representation',
        name: 'Data Representation',
        nodeSlugs: ['data-representation'],
        topics: [
          'Representation of characters, integers and fractions',
          'Binary and hexadecimal representations',
          'Binary arithmetic: addition, subtraction, multiplication, division',
          "Two's complement arithmetic",
          'Floating point representation of numbers',
          'Boolean algebra',
        ],
      },
      {
        slug: 'computer-hardware',
        name: 'Computer Hardware',
        nodeSlugs: [],
        topics: [
          'Input devices: keyboard, mouse, scanner, etc.',
          'Output devices: monitor, printer, speakers, etc.',
          'Storage devices: hard drives, SSDs, USB drives, etc.',
          'Memory: RAM, ROM, cache, etc.',
        ],
      },
      {
        slug: 'computer-software',
        name: 'Computer Software',
        nodeSlugs: ['basics-of-operating-systems'],
        topics: [
          'Operating systems: Windows, macOS, Linux, Android, etc.',
          'System software: utility programs, device drivers',
          'Application software: basic concepts and tools',
        ],
      },
      {
        slug: 'internet-and-email',
        name: 'Internet and Email',
        nodeSlugs: ['basics-of-networking'],
        topics: [
          'Web browsing: how the internet works and how to navigate it',
          'Email: sending, receiving and managing emails',
          'Online security: basic awareness of online threats and safety measures',
        ],
      },
    ],
  },
  {
    slug: 'general-english',
    name: 'General English',
    shortName: 'English',
    part: 'III',
    questions: 10,
    summary: 'Reading comprehension, vocabulary, grammar, word meaning and technical writing.',
    groupedBy: 'syllabuzai',
    nodeSlugs: ['general-english'],
    units: [
      {
        slug: 'comprehension',
        name: 'Comprehension',
        nodeSlugs: ['reading-comprehension'],
        topics: ['Comprehension of written text'],
      },
      {
        slug: 'vocabulary',
        name: 'Vocabulary',
        nodeSlugs: ['vocabulary'],
        topics: ['Usage of words (vocabulary)', 'Meaning of words and phrases'],
      },
      {
        slug: 'grammar-and-usage',
        name: 'Grammar and Usage',
        nodeSlugs: ['grammar-and-usage'],
        topics: [
          'Grammatical patterns: usage of sentence forms',
          'Sounds and word formation processes',
          'Technical writing',
          'Overall accuracy and fluency in English for technical education',
        ],
      },
    ],
  },
];

export function findSubject(slug: string) {
  return SYLLABUS.find((s) => s.slug === slug) ?? null;
}

export function findUnit(subjectSlug: string, unitSlug: string) {
  const subject = findSubject(subjectSlug);
  const unit = subject?.units.find((u) => u.slug === unitSlug);
  return subject && unit ? { subject, unit } : null;
}

export const TOTAL_UNITS = SYLLABUS.reduce((n, s) => n + s.units.length, 0);
export const TOTAL_TOPICS = SYLLABUS.reduce((n, s) => n + s.units.reduce((m, u) => m + u.topics.length, 0), 0);
