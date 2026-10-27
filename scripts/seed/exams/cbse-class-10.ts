/** Run: npx tsx scripts/seed/exams/cbse-class-10.ts */
import { seedExamCurriculum, runSeed } from '../lib/upsert';
import { cbseClass10Subjects } from '../data/board-subjects';

runSeed(() =>
  seedExamCurriculum({
    programName: 'UG CUET & Board Exams',
    programDescription: 'Common University Entrance Test and school board exams.',
    examName: 'CBSE Class 10 Board',
    examDescription: 'Central Board of Secondary Education secondary (Class 10) board exam.',
    subjects: cbseClass10Subjects,
  }),
);
