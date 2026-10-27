/** Run: npx tsx scripts/seed/exams/jee-main.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, mathematicsCore } from '../data/shared-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG Engineering Exams',
    programDescription: 'Undergraduate engineering entrance exams (B.Tech admissions).',
    examName: 'JEE Main',
    examDescription: 'National-level UG engineering entrance exam; also qualifies candidates for JEE Advanced.',
    subjects: [physics, chemistry, mathematicsCore],
  }),
);
