/** Run: npx tsx scripts/seed/exams/cuet-ug.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, mathematicsCore, biology } from '../data/shared-subjects';
import { cbse12CuetSubjects } from '../data/board-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG CUET & Board Exams',
    programDescription: 'Common University Entrance Test and school board exams.',
    examName: 'CUET-UG',
    examDescription: 'Common University Entrance Test for undergraduate admissions — domain subjects mirror the CBSE Class 12 syllabus.',
    subjects: [physics, chemistry, mathematicsCore, biology, ...cbse12CuetSubjects],
  }),
);
