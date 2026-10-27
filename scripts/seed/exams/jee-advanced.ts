/** Run: npx tsx scripts/seed/exams/jee-advanced.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, mathematicsCore } from '../data/shared-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG Engineering Exams',
    programDescription: 'Undergraduate engineering entrance exams (B.Tech admissions).',
    examName: 'JEE Advanced',
    examDescription: 'IIT admission exam, taken after qualifying JEE Main.',
    subjects: [physics, chemistry, mathematicsCore],
  }),
);
