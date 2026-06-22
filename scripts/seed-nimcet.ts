/**
 * NIMCET full seed: exam → subjects → topics → starter NIMCET course.
 * Run: npx tsx --env-file=.env.development scripts/seed-nimcet.ts
 */

import { getAdapter, slugify, nowIso, generateId } from './seed-helpers';

// ─── NIMCET Exam pattern ──────────────────────────────────────────────────────
// 120 questions · 480 marks · 2 hours · +4/−1

const NIMCET_SUBJECTS = [
  {
    name: 'Mathematics',
    shortName: 'Math',
    iconName: 'calculator',
    color: '#6366f1',
    questions: 50,
    marks: 200,
    topics: [
      'Sets, Relations & Functions',
      'Mathematical Logic',
      'Algebra & Number Theory',
      'Permutations & Combinations',
      'Sequences & Series',
      'Matrices & Determinants',
      'Trigonometry',
      'Coordinate Geometry',
      'Vectors & 3D Geometry',
      'Calculus (Limits, Derivatives, Integration)',
      'Probability & Statistics',
    ],
  },
  {
    name: 'Computer Applications',
    shortName: 'CS',
    iconName: 'cpu',
    color: '#0ea5e9',
    questions: 10,
    marks: 40,
    topics: [
      'Computer Fundamentals & Organisation',
      'Data Representation (Binary, Octal, Hex)',
      'Boolean Algebra & Logic Gates',
      'Computer Architecture',
      'Programming in C',
      'Data Structures (Arrays, Linked Lists, Trees)',
      'Algorithms & Complexity',
      'Operating System Concepts',
      'Database Management Systems',
      'Computer Networks & Internet',
    ],
  },
  {
    name: 'Analytical Ability & Logical Reasoning',
    shortName: 'Reasoning',
    iconName: 'brain',
    color: '#f59e0b',
    questions: 40,
    marks: 160,
    topics: [
      'Number & Letter Series',
      'Coding & Decoding',
      'Blood Relations',
      'Direction & Distance',
      'Seating Arrangements',
      'Syllogisms',
      'Statement & Conclusions',
      'Analogies',
      'Calendar & Clock Problems',
      'Logical Puzzles',
    ],
  },
  {
    name: 'General English',
    shortName: 'English',
    iconName: 'book-open',
    color: '#10b981',
    questions: 10,
    marks: 40,
    topics: [
      'Reading Comprehension',
      'Vocabulary (Synonyms & Antonyms)',
      'Grammar & Usage',
      'Fill in the Blanks',
      'Error Identification',
      'Sentence Correction',
    ],
  },
  {
    name: 'General Awareness',
    shortName: 'GK',
    iconName: 'globe',
    color: '#ec4899',
    questions: 10,
    marks: 40,
    topics: [
      'Current Affairs (National & International)',
      'Science & Technology',
      'Indian History & Culture',
      'Indian Geography',
      'Indian Economy & Polity',
      'Sports, Awards & Events',
    ],
  },
];

// ─── Starter NIMCET course structure ─────────────────────────────────────────

const NIMCET_COURSE = {
  title: 'NIMCET Complete Preparation 2025',
  shortDescription: 'Full-syllabus NIMCET prep with recorded lectures, live doubt sessions & 50+ mock tests.',
  type: 'HYBRID' as const,
  level: 'INTERMEDIATE' as const,
  language: 'English',
  tags: ['nimcet', 'mca-entrance', 'mathematics', 'reasoning', 'computer-science'],
  isSubscriptionRequired: false,
  status: 'PUBLISHED' as const,
  totalHours: 120,
};

async function seedNimcet() {
  const db = await getAdapter();
  console.log('\n── NIMCET Seed ──────────────────────────────────────');

  // 1. Exam
  console.log('\n[1/4] Exam');
  const examId = await db.upsertBySlug('exams', 'nimcet', {
    name: 'NIMCET',
    slug: 'nimcet',
    fullName: 'National Institute of Technology MCA Common Entrance Test',
    category: 'ENGINEERING',
    conductedBy: 'NIT Warangal',
    isFeatured: true,
    isActive: true,
    subjectIds: [],
    mcqCount: 0,
    description: 'National entrance for MCA at NITs — 120 MCQs · 480 marks · 120 min · +4/−1',
    officialWebsite: 'https://nimcet.in',
    logoUrl: '',
    examPattern: {
      totalQuestions: 120,
      totalMarks: 480,
      durationMinutes: 120,
      correctMarks: 4,
      negativeMarks: 1,
      sections: [
        { name: 'Mathematics', questions: 50, marks: 200 },
        { name: 'Computer Applications', questions: 10, marks: 40 },
        { name: 'Analytical Ability & Logical Reasoning', questions: 40, marks: 160 },
        { name: 'General English', questions: 10, marks: 40 },
        { name: 'General Awareness', questions: 10, marks: 40 },
      ],
    },
  });

  // 2. Global subjects + topics (for MCQ tagging & syllabus tracker)
  console.log('\n[2/4] Subjects & Topics');
  const subjectIds: string[] = [];
  for (const sub of NIMCET_SUBJECTS) {
    const slug = slugify(sub.name);
    const subjectId = await db.upsertBySlug('subjects', slug, {
      name: sub.name,
      slug,
      shortName: sub.shortName,
      iconName: sub.iconName,
      color: sub.color,
      isActive: true,
      topicCount: sub.topics.length,
      mcqCount: 0,
      examIds: [examId],
    });
    subjectIds.push(subjectId);

    for (let i = 0; i < sub.topics.length; i++) {
      const topicSlug = slugify(`nimcet-${sub.name}-${sub.topics[i]}`);
      await db.upsertBySlug('topics', topicSlug, {
        name: sub.topics[i],
        slug: topicSlug,
        subjectId,
        parentId: null,
        depth: 0,
        path: [],
        pathNames: [],
        order: i,
        isActive: true,
        mcqCount: 0,
        examIds: [examId],
      });
    }
  }

  // Update exam with subjectIds
  await db.update('exams', examId, { subjectIds });

  // 3. Exam-subject linking (ExamSubjectSection collection for syllabus tracker)
  console.log('\n[3/4] Exam sections');
  for (let i = 0; i < NIMCET_SUBJECTS.length; i++) {
    const sub = NIMCET_SUBJECTS[i];
    const subjectId = subjectIds[i];
    await db.upsertByFields('examSubjectSections', { examId, subjectId }, {
      examId,
      subjectId,
      order: i,
      questionsInExam: sub.questions,
      marksInExam: sub.marks,
      isActive: true,
    });
  }

  // 4. Starter NIMCET course
  console.log('\n[4/4] Starter course');
  const now = nowIso();
  const courseSlug = 'nimcet-complete-2025';
  const courseId = await db.upsertBySlug('courses', courseSlug, {
    ...NIMCET_COURSE,
    slug: courseSlug,
    examId,
    teacherIds: [],
    sessionDays: [],
    enrolledCount: 0,
    totalLessons: 0,
    totalLiveSessions: 0,
    publishedAt: now,
    createdBy: 'seed',
  });

  // Course subjects (mirrors global subjects)
  for (let si = 0; si < NIMCET_SUBJECTS.length; si++) {
    const sub = NIMCET_SUBJECTS[si];
    const csId = generateId();
    await db.upsertByFields('courseSubjects', { courseId, title: sub.name }, {
      id: csId,
      courseId,
      title: sub.name,
      iconName: sub.iconName,
      color: sub.color,
      order: si,
      lessonCount: 0,
      topicCount: sub.topics.length,
    });

    // Course topics per subject
    for (let ti = 0; ti < sub.topics.length; ti++) {
      await db.upsertByFields('courseTopics', { courseId, title: sub.topics[ti] }, {
        id: generateId(),
        courseSubjectId: csId,
        courseId,
        title: sub.topics[ti],
        order: ti,
        lessonCount: 0,
      });
    }
  }

  console.log('\n✓ NIMCET seed complete');
  console.log(`  Exam ID   : ${examId}`);
  console.log(`  Course ID : ${courseId}`);
  console.log(`  Subjects  : ${NIMCET_SUBJECTS.length}`);
  console.log(`  Topics    : ${NIMCET_SUBJECTS.reduce((a, s) => a + s.topics.length, 0)}`);
}

seedNimcet().catch(console.error);
