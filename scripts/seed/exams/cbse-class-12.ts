/** Run: npx tsx scripts/seed/exams/cbse-class-12.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { physics, chemistry, mathematicsCore, biology } from '../data/shared-subjects';
import { cbse12CuetSubjects } from '../data/board-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG CUET & Board Exams',
    programDescription: 'Common University Entrance Test and school board exams.',
    examName: 'CBSE Class 12 Board',
    examDescription: 'Central Board of Secondary Education senior secondary (Class 12) board exam.',
    subjects: [physics, chemistry, mathematicsCore, biology, ...cbse12CuetSubjects],
  }),
);
