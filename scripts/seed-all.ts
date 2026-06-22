/**
 * Full seed: subjects → topics → exams → examSections
 * Supports both Firebase and MongoDB via DATABASE_PROVIDER env var.
 * Run: npx tsx --env-file=.env.development scripts/seed-all.ts
 */

import { getAdapter, slugify } from './seed-helpers';

// ─── Subjects ─────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { name: 'Physics', shortName: 'PHY', iconName: 'atom', color: '#3b82f6' },
  { name: 'Chemistry', shortName: 'CHE', iconName: 'flask-conical', color: '#10b981' },
  { name: 'Mathematics', shortName: 'MAT', iconName: 'calculator', color: '#f59e0b' },
  { name: 'Biology', shortName: 'BIO', iconName: 'dna', color: '#ef4444' },
];

// ─── Topics tree per subject ───────────────────────────────────────────────────

const TOPICS: Record<string, { name: string; chapters: { name: string; sections?: string[] }[] }> = {
  Physics: {
    name: 'Physics',
    chapters: [
      { name: 'Mechanics', sections: ['Kinematics', 'Laws of Motion', 'Work, Energy & Power', 'Rotational Motion', 'Gravitation'] },
      { name: 'Waves & Oscillations', sections: ['Simple Harmonic Motion', 'Waves', 'Sound'] },
      { name: 'Thermodynamics', sections: ['Heat & Temperature', 'Laws of Thermodynamics', 'Kinetic Theory of Gases'] },
      { name: 'Electrostatics', sections: ['Electric Charges & Fields', 'Electric Potential', 'Capacitance'] },
      { name: 'Current Electricity', sections: ["Ohm's Law", "Kirchhoff's Laws", 'Electrical Instruments'] },
      { name: 'Magnetism', sections: ['Magnetic Force', 'Magnetic Field', 'Electromagnetic Induction'] },
      { name: 'Optics', sections: ['Ray Optics', 'Wave Optics'] },
      { name: 'Modern Physics', sections: ['Photoelectric Effect', 'Atomic Structure', 'Nuclear Physics'] },
    ],
  },
  Chemistry: {
    name: 'Chemistry',
    chapters: [
      { name: 'Physical Chemistry', sections: ['Atomic Structure', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Chemical Kinetics'] },
      { name: 'Organic Chemistry', sections: ['Basic Concepts', 'Hydrocarbons', 'Haloalkanes & Haloarenes', 'Alcohols & Ethers', 'Aldehydes & Ketones', 'Carboxylic Acids', 'Amines', 'Polymers', 'Biomolecules'] },
      { name: 'Inorganic Chemistry', sections: ['Periodic Table', 's-Block Elements', 'p-Block Elements', 'd & f Block Elements', 'Coordination Compounds', 'Environmental Chemistry'] },
    ],
  },
  Mathematics: {
    name: 'Mathematics',
    chapters: [
      { name: 'Algebra', sections: ['Sets & Relations', 'Complex Numbers', 'Quadratic Equations', 'Sequences & Series', 'Permutations & Combinations', 'Binomial Theorem', 'Matrices & Determinants'] },
      { name: 'Calculus', sections: ['Limits & Continuity', 'Differentiation', 'Applications of Derivatives', 'Integration', 'Definite Integrals', 'Differential Equations'] },
      { name: 'Coordinate Geometry', sections: ['Straight Lines', 'Circles', 'Parabola', 'Ellipse', 'Hyperbola'] },
      { name: 'Trigonometry', sections: ['Trigonometric Functions', 'Inverse Trigonometry', 'Heights & Distances'] },
      { name: 'Vectors & 3D', sections: ['Vectors', '3D Geometry'] },
      { name: 'Statistics & Probability', sections: ['Statistics', 'Probability'] },
    ],
  },
  Biology: {
    name: 'Biology',
    chapters: [
      { name: 'Cell Biology', sections: ['Cell Structure', 'Cell Division', 'Biomolecules'] },
      { name: 'Genetics', sections: ['Principles of Heredity', 'Molecular Basis of Inheritance', 'Evolution'] },
      { name: 'Plant Physiology', sections: ['Photosynthesis', 'Respiration', 'Plant Growth'] },
      { name: 'Human Physiology', sections: ['Digestion', 'Circulation', 'Respiration', 'Nervous System', 'Endocrine System', 'Reproduction'] },
      { name: 'Ecology', sections: ['Ecosystems', 'Biodiversity', 'Environmental Issues'] },
    ],
  },
};

// ─── Exams ────────────────────────────────────────────────────────────────────

const EXAMS = [
  { name: 'JEE Main', fullName: 'Joint Entrance Examination (Main)', category: 'ENGINEERING', conductedBy: 'NTA', isFeatured: true, subjectNames: ['Physics', 'Chemistry', 'Mathematics'] },
  { name: 'JEE Advanced', fullName: 'Joint Entrance Examination (Advanced)', category: 'ENGINEERING', conductedBy: 'IITs', isFeatured: true, subjectNames: ['Physics', 'Chemistry', 'Mathematics'] },
  { name: 'NEET-UG', fullName: 'National Eligibility cum Entrance Test (UG)', category: 'MEDICAL', conductedBy: 'NTA', isFeatured: true, subjectNames: ['Physics', 'Chemistry', 'Biology'] },
  { name: 'BITSAT', fullName: 'BITS Admission Test', category: 'ENGINEERING', conductedBy: 'BITS Pilani', isFeatured: false, subjectNames: ['Physics', 'Chemistry', 'Mathematics'] },
  { name: 'MHT-CET', fullName: 'Maharashtra Common Entrance Test', category: 'ENGINEERING', conductedBy: 'State CET Cell Maharashtra', isFeatured: false, subjectNames: ['Physics', 'Chemistry', 'Mathematics'] },
  { name: 'KCET', fullName: 'Karnataka Common Entrance Test', category: 'ENGINEERING', conductedBy: 'KEA', isFeatured: false, subjectNames: ['Physics', 'Chemistry', 'Mathematics', 'Biology'] },
  { name: 'VITEEE', fullName: 'VIT Engineering Entrance Examination', category: 'ENGINEERING', conductedBy: 'VIT University', isFeatured: false, subjectNames: ['Physics', 'Chemistry', 'Mathematics'] },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────

async function seed() {
  const db = await getAdapter();

  // 1. Create subjects
  console.log('\n── Subjects ─────────────────────────────');
  const subjectIds: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const slug = slugify(s.name);
    const id = await db.upsertBySlug('subjects', slug, {
      ...s, slug, isActive: true, topicCount: 0, mcqCount: 0,
    });
    subjectIds[s.name] = id;
  }

  // 2. Create topics
  console.log('\n── Topics ───────────────────────────────');
  const topicIds: Record<string, string> = {}; // "SubjectName/ChapterName[/SectionName]" → id

  for (const [subjectName, tree] of Object.entries(TOPICS)) {
    const subjectId = subjectIds[subjectName];
    if (!subjectId) continue;
    let chapterOrder = 0;

    for (const chapter of tree.chapters) {
      const chapterSlug = slugify(chapter.name);
      let chapterId: string;
      const existingChapter = await db.findByFields('topics', { subjectId, slug: chapterSlug });

      if (existingChapter) {
        console.log(`  SKIP  [${chapter.name}]`);
        chapterId = existingChapter.id;
      } else {
        chapterId = await db.upsertByFields('topics', { subjectId, slug: chapterSlug }, {
          name: chapter.name,
          slug: chapterSlug,
          subjectId,
          parentId: null,
          depth: 0,
          path: [],
          pathNames: [],
          order: chapterOrder,
          isActive: true,
          mcqCount: 0,
        });
      }
      topicIds[`${subjectName}/${chapter.name}`] = chapterId;
      chapterOrder++;

      // Sections
      let sectionOrder = 0;
      for (const sectionName of chapter.sections ?? []) {
        const sectionSlug = slugify(sectionName);
        const existingSection = await db.findByFields('topics', { subjectId, parentId: chapterId, slug: sectionSlug });

        let sectionId: string;
        if (existingSection) {
          console.log(`    SKIP  [${sectionName}]`);
          sectionId = existingSection.id;
        } else {
          sectionId = await db.upsertByFields('topics', { subjectId, parentId: chapterId, slug: sectionSlug }, {
            name: sectionName,
            slug: sectionSlug,
            subjectId,
            parentId: chapterId,
            depth: 1,
            path: [chapterId],
            pathNames: [chapter.name],
            order: sectionOrder,
            isActive: true,
            mcqCount: 0,
          });
        }
        topicIds[`${subjectName}/${chapter.name}/${sectionName}`] = sectionId;
        sectionOrder++;
      }
    }

    // Update subject topicCount
    const topicCount = await db.countByField('topics', 'subjectId', subjectId);
    await db.update('subjects', subjectId, { topicCount });
  }

  // 3. Create exams + exam sections
  console.log('\n── Exams ────────────────────────────────');
  for (const exam of EXAMS) {
    const slug = slugify(exam.name);
    const examSubjectIds = exam.subjectNames.map((n) => subjectIds[n]).filter(Boolean);

    const existingExam = await db.findByField('exams', 'slug', slug);
    let examId: string;
    if (existingExam) {
      examId = existingExam.id;
      await db.update('exams', examId, { subjectIds: examSubjectIds });
      console.log(`  UPDATE [${exam.name}] subjectIds`);
    } else {
      examId = await db.upsertBySlug('exams', slug, {
        name: exam.name,
        fullName: exam.fullName,
        slug,
        category: exam.category,
        conductedBy: exam.conductedBy,
        isFeatured: exam.isFeatured,
        isActive: true,
        subjectIds: examSubjectIds,
        mcqCount: 0,
        description: '',
      });
    }

    // Create exam sections (one per chapter per subject)
    console.log(`    Sections for ${exam.name}:`);
    let sectionOrder = 0;
    for (const subjectName of exam.subjectNames) {
      const subjectId = subjectIds[subjectName];
      if (!subjectId) continue;
      const subjectTree = TOPICS[subjectName];
      if (!subjectTree) continue;

      for (const chapter of subjectTree.chapters) {
        const topicId = topicIds[`${subjectName}/${chapter.name}`];
        if (!topicId) continue;

        await db.upsertByFields('examSections', { examId, topicId }, {
          examId,
          subjectId,
          topicId,
          displayName: `${subjectName} — ${chapter.name}`,
          difficultyProfile: 'MIXED',
          isActive: true,
          order: sectionOrder,
        });
        sectionOrder++;
      }
    }
  }

  console.log('\n✓ Seed complete.\n');
}

seed().catch((err) => { console.error(err); process.exit(1); });
