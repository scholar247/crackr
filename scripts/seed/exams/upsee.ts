/** Run: npx tsx scripts/seed/exams/upsee.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, mathematicsCore } from '../data/shared-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG Engineering Exams',
    programDescription: 'Undergraduate engineering entrance exams (B.Tech admissions).',
    examName: 'UPSEE',
    examDescription: 'Uttar Pradesh State Entrance Examination for engineering admissions.',
    subjects: [physics, chemistry, mathematicsCore],
  }),
);
