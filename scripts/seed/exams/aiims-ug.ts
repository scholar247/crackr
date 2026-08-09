/** Run: npx tsx scripts/seed/exams/aiims-ug.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, biology } from '../data/shared-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG Medical Exams',
    programDescription: 'Undergraduate medical entrance exams (MBBS/BDS admissions).',
    examName: 'AIIMS-UG',
    examDescription: 'Historical AIIMS undergraduate entrance exam (since merged into NEET-UG counselling).',
    subjects: [physics, chemistry, biology],
  }),
);
