nly/**
 * Runs every exam's curriculum seed in one process. Order doesn't matter for
 * correctness — seedExamCurriculum() is idempotent and shared subjects (Physics,
 * Mathematics, Engineering Mathematics, ...) are looked up by slug regardless of which
 * exam creates them first — but grouping by program reads more sensibly in the logs.
 *
 * Run: npx tsx scripts/seed/run-all.ts
 */
import { seedExamCurriculum, runSeed } from './lib/upsert';
import { physics, chemistry, mathematicsCore, biology, engineeringMathematics, digitalLogic } from './data/shared-subjects';
import { gateCseSubjects } from './data/gate-cse-subjects';
import { gateEceSubjects } from './data/gate-ece-subjects';
import { nimcetSubjects } from './data/nimcet-subjects';
import { cbse12CuetSubjects, cbseClass10Subjects } from './data/board-subjects';

const PG_ENGINEERING = {
  programName: 'PG Engineering Exams',
  programDescription: 'Postgraduate engineering entrance exams (M.Tech/MCA admissions).',
};
const UG_ENGINEERING = {
  programName: 'UG Engineering Exams',
  programDescription: 'Undergraduate engineering entrance exams (B.Tech admissions).',
};
const UG_MEDICAL = {
  programName: 'UG Medical Exams',
  programDescription: 'Undergraduate medical entrance exams (MBBS/BDS admissions).',
};
const UG_BOARD = {
  programName: 'UG CUET & Board Exams',
  programDescription: 'Common University Entrance Test and school board exams.',
};

runSeed(async () => {
  await seedExamCurriculum({
    ...PG_ENGINEERING,
    examName: 'GATE-CSE',
    examDescription: 'Graduate Aptitude Test in Engineering — Computer Science and Information Technology paper.',
    subjects: [engineeringMathematics, digitalLogic, ...gateCseSubjects],
  });
  await seedExamCurriculum({
    ...PG_ENGINEERING,
    examName: 'GATE-ECE',
    examDescription: 'Graduate Aptitude Test in Engineering — Electronics and Communication Engineering paper.',
    subjects: [engineeringMathematics, digitalLogic, ...gateEceSubjects],
  });
  await seedExamCurriculum({
    ...PG_ENGINEERING,
    examName: 'NIMCET',
    examDescription: 'NIT MCA Common Entrance Test for admission to MCA programs at NITs.',
    subjects: nimcetSubjects,
  });

  await seedExamCurriculum({
    ...UG_ENGINEERING,
    examName: 'JEE Main',
    examDescription: 'National-level UG engineering entrance exam; also qualifies candidates for JEE Advanced.',
    subjects: [physics, chemistry, mathematicsCore],
  });
  await seedExamCurriculum({
    ...UG_ENGINEERING,
    examName: 'JEE Advanced',
    examDescription: 'IIT admission exam, taken after qualifying JEE Main.',
    subjects: [physics, chemistry, mathematicsCore],
  });
  await seedExamCurriculum({
    ...UG_ENGINEERING,
    examName: 'UPSEE',
    examDescription: 'Uttar Pradesh State Entrance Examination for engineering admissions.',
    subjects: [physics, chemistry, mathematicsCore],
  });

  await seedExamCurriculum({
    ...UG_MEDICAL,
    examName: 'NEET-UG',
    examDescription: 'National Eligibility cum Entrance Test for undergraduate medical admissions.',
    subjects: [physics, chemistry, biology],
  });
  await seedExamCurriculum({
    ...UG_MEDICAL,
    examName: 'AIIMS-UG',
    examDescription: 'Historical AIIMS undergraduate entrance exam (since merged into NEET-UG counselling).',
    subjects: [physics, chemistry, biology],
  });
  await seedExamCurriculum({
    ...UG_MEDICAL,
    examName: 'JIPMER-UG',
    examDescription: 'Historical JIPMER undergraduate entrance exam (since merged into NEET-UG counselling).',
    subjects: [physics, chemistry, biology],
  });

  await seedExamCurriculum({
    ...UG_BOARD,
    examName: 'CUET-UG',
    examDescription: 'Common University Entrance Test for undergraduate admissions — domain subjects mirror the CBSE Class 12 syllabus.',
    subjects: [physics, chemistry, mathematicsCore, biology, ...cbse12CuetSubjects],
  });
  await seedExamCurriculum({
    ...UG_BOARD,
    examName: 'CBSE Class 12 Board',
    examDescription: 'Central Board of Secondary Education senior secondary (Class 12) board exam.',
    subjects: [physics, chemistry, mathematicsCore, biology, ...cbse12CuetSubjects],
  });
  await seedExamCurriculum({
    ...UG_BOARD,
    examName: 'CBSE Class 10 Board',
    examDescription: 'Central Board of Secondary Education secondary (Class 10) board exam.',
    subjects: cbseClass10Subjects,
  });
});
