/** Run: npx tsx scripts/seed/exams/neet-ug.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, biology } from '../data/shared-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG Medical Exams',
    programDescription: 'Undergraduate medical entrance exams (MBBS/BDS admissions).',
    examName: 'NEET-UG',
    examDescription: 'National Eligibility cum Entrance Test for undergraduate medical admissions.',
    subjects: [physics, chemistry, biology],
  }),
);
