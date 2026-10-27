/** Run: npx tsx scripts/seed/exams/nimcet.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { nimcetSubjects } from '../data/nimcet-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'PG Engineering Exams',
    programDescription: 'Postgraduate engineering entrance exams (M.Tech/MCA admissions).',
    examName: 'NIMCET',
    examDescription: 'NIT MCA Common Entrance Test for admission to MCA programs at NITs.',
    subjects: nimcetSubjects,
  }),
);
