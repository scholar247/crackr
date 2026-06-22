/**
 * Seed script: creates Indian competitive exams.
 * Supports both Firebase and MongoDB via DATABASE_PROVIDER env var.
 * Run: npx tsx --env-file=.env.development scripts/seed-exams.ts
 */

import { getAdapter, slugify } from './seed-helpers';

const EXAMS = [
  // Engineering
  { name: 'JEE Main', fullName: 'Joint Entrance Examination (Main)', category: 'ENGINEERING', conductedBy: 'NTA', isFeatured: true },
  { name: 'JEE Advanced', fullName: 'Joint Entrance Examination (Advanced)', category: 'ENGINEERING', conductedBy: 'IITs', isFeatured: true },
  { name: 'BITSAT', fullName: 'BITS Admission Test', category: 'ENGINEERING', conductedBy: 'BITS Pilani', isFeatured: false },
  { name: 'VITEEE', fullName: 'VIT Engineering Entrance Examination', category: 'ENGINEERING', conductedBy: 'VIT University', isFeatured: false },
  { name: 'MHT-CET', fullName: 'Maharashtra Common Entrance Test', category: 'ENGINEERING', conductedBy: 'State CET Cell Maharashtra', isFeatured: false },
  { name: 'KCET', fullName: 'Karnataka Common Entrance Test', category: 'ENGINEERING', conductedBy: 'KEA', isFeatured: false },

  // Medical
  { name: 'NEET-UG', fullName: 'National Eligibility cum Entrance Test (UG)', category: 'MEDICAL', conductedBy: 'NTA', isFeatured: true },
  { name: 'AIIMS MBBS', fullName: 'All India Institute of Medical Sciences MBBS', category: 'MEDICAL', conductedBy: 'AIIMS', isFeatured: false },
  { name: 'JIPMER', fullName: 'Jawaharlal Institute of Postgraduate Medical Education & Research', category: 'MEDICAL', conductedBy: 'JIPMER', isFeatured: false },

  // Management
  { name: 'CAT', fullName: 'Common Admission Test', category: 'MANAGEMENT', conductedBy: 'IIMs', isFeatured: true },
  { name: 'XAT', fullName: 'Xavier Aptitude Test', category: 'MANAGEMENT', conductedBy: 'XLRI', isFeatured: false },
  { name: 'MAT', fullName: 'Management Aptitude Test', category: 'MANAGEMENT', conductedBy: 'AIMA', isFeatured: false },

  // Banking
  { name: 'SBI PO', fullName: 'State Bank of India Probationary Officer', category: 'BANKING', conductedBy: 'SBI', isFeatured: true },
  { name: 'IBPS PO', fullName: 'Institute of Banking Personnel Selection Probationary Officer', category: 'BANKING', conductedBy: 'IBPS', isFeatured: false },
  { name: 'RBI Grade B', fullName: 'Reserve Bank of India Grade B Officer', category: 'BANKING', conductedBy: 'RBI', isFeatured: false },

  // Government
  { name: 'UPSC CSE', fullName: 'Union Public Service Commission Civil Services Examination', category: 'GOVERNMENT', conductedBy: 'UPSC', isFeatured: true },
  { name: 'SSC CGL', fullName: 'Staff Selection Commission Combined Graduate Level', category: 'GOVERNMENT', conductedBy: 'SSC', isFeatured: false },
  { name: 'NDA', fullName: 'National Defence Academy', category: 'GOVERNMENT', conductedBy: 'UPSC', isFeatured: false },

  // School
  { name: 'NTSE', fullName: 'National Talent Search Examination', category: 'SCHOOL', conductedBy: 'NCERT', isFeatured: false },
] as const;

async function seedExams() {
  const db = await getAdapter();
  let created = 0;
  let skipped = 0;

  for (const exam of EXAMS) {
    const slug = slugify(exam.name);
    const existing = await db.findByField('exams', 'slug', slug);
    if (existing) {
      console.log(`  SKIP  ${exam.name} (already exists)`);
      skipped++;
      continue;
    }

    await db.upsertBySlug('exams', slug, {
      ...exam,
      slug,
      subjectIds: [],
      mcqCount: 0,
      isActive: true,
      description: '',
      logoUrl: '',
      officialWebsite: '',
    });
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

seedExams().catch(console.error);
