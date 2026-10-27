/** Run: npx tsx scripts/seed/exams/gate-cse.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { engineeringMathematics, digitalLogic } from '../data/shared-subjects';
import { gateCseSubjects } from '../data/gate-cse-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'PG Engineering Exams',
    programDescription: 'Postgraduate engineering entrance exams (M.Tech/MCA admissions).',
    examName: 'GATE-CSE',
    examDescription: 'Graduate Aptitude Test in Engineering — Computer Science and Information Technology paper.',
    subjects: [engineeringMathematics, digitalLogic, ...gateCseSubjects],
  }),
);
