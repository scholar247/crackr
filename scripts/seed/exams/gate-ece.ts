/** Run: npx tsx scripts/seed/exams/gate-ece.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { engineeringMathematics, digitalLogic } from '../data/shared-subjects';
import { gateEceSubjects } from '../data/gate-ece-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'PG Engineering Exams',
    programDescription: 'Postgraduate engineering entrance exams (M.Tech/MCA admissions).',
    examName: 'GATE-ECE',
    examDescription: 'Graduate Aptitude Test in Engineering — Electronics and Communication Engineering paper.',
    subjects: [engineeringMathematics, digitalLogic, ...gateEceSubjects],
  }),
);
