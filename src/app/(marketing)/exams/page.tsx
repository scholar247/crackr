import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { ExamsBrowser, type ProgramGroup } from '@/components/marketing/exams-browser';

export const metadata: Metadata = { title: 'Exams' };
export const dynamic = 'force-dynamic';

// Illustrative — mock/PYP/MCQ volume isn't tracked per exam in the DB yet.
const EXAM_STATS: Record<string, { mocks: string; pyp: string; mcqs: string }> = {
  nimcet: { mocks: '120+', pyp: '15 Yrs', mcqs: '5K+' },
  'bhu-mca': { mocks: '60+', pyp: '8 Yrs', mcqs: '2K+' },
  'gate-cse': { mocks: '150+', pyp: '10 Yrs', mcqs: '12K+' },
  'gate-ece': { mocks: '100+', pyp: '10 Yrs', mcqs: '8K+' },
  'jee-main': { mocks: '200+', pyp: '20 Yrs', mcqs: '20K+' },
  'jee-advanced': { mocks: '150+', pyp: '15 Yrs', mcqs: '15K+' },
  upsee: { mocks: '80+', pyp: '12 Yrs', mcqs: '6K+' },
  'neet-ug': { mocks: '180+', pyp: '18 Yrs', mcqs: '18K+' },
  'aiims-ug': { mocks: '90+', pyp: '10 Yrs', mcqs: '7K+' },
  'jipmer-ug': { mocks: '70+', pyp: '8 Yrs', mcqs: '5K+' },
  'cuet-ug': { mocks: '100+', pyp: '4 Yrs', mcqs: '10K+' },
  'cbse-class-12-board': { mocks: '60+', pyp: '10 Yrs', mcqs: '8K+' },
  'cbse-class-10-board': { mocks: '50+', pyp: '10 Yrs', mcqs: '6K+' },
};
const DEFAULT_STATS = { mocks: '50+', pyp: '5 Yrs', mcqs: '3K+' };

function computeInitials(name: string, takenInGroup: Set<string>): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  let initials = words[0].slice(0, 2).toUpperCase();
  if (takenInGroup.has(initials) && words.length > 1) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  }
  takenInGroup.add(initials);
  return initials;
}

export default async function ExamsPage() {
  const [programs, examRows] = await Promise.all([
    taxonomyRepository.listPublicPrograms(),
    taxonomyRepository.listPublicExams(),
  ]);

  // Subject count per exam, so the "featured" card in each group is whichever
  // exam actually has the richest seeded syllabus — not just whatever sorts
  // first alphabetically (e.g. BHU-MCA has almost no curriculum seeded yet
  // and shouldn't outrank NIMCET just because "B" < "N").
  const subjectCounts = await Promise.all(
    examRows.map(async ({ exam }) => [exam.id, (await taxonomyRepository.getSyllabusTree(exam.id)).length] as const)
  );
  const subjectCountByExamId = new Map(subjectCounts);

  const examsByProgramName = examRows.reduce<Record<string, typeof examRows>>((acc, row) => {
    (acc[row.programName] ??= []).push(row);
    return acc;
  }, {});

  const groups: ProgramGroup[] = programs
    .map((program) => {
      const rows = [...(examsByProgramName[program.name] ?? [])].sort(
        (a, b) =>
          (subjectCountByExamId.get(b.exam.id) ?? 0) - (subjectCountByExamId.get(a.exam.id) ?? 0) ||
          a.exam.name.localeCompare(b.exam.name)
      );
      const taken = new Set<string>();
      return {
        slug: program.slug,
        name: program.name,
        exams: rows.map(({ exam }) => ({
          id: exam.id,
          slug: exam.slug,
          name: exam.name,
          description: exam.description,
          initials: computeInitials(exam.name, taken),
          stats: EXAM_STATS[exam.slug] ?? DEFAULT_STATS,
        })),
      };
    })
    .filter((g) => g.exams.length > 0);

  return (
    <main>
      {/* Visually hidden — the reference design has no visible page title above the
       * search bar, but a real h1 is kept for accessibility/SEO structure. */}
      <h1 className="sr-only">Exams</h1>

      {groups.length === 0 ? (
        <p className="text-body-sm mx-auto max-w-6xl px-4 py-10 text-muted-foreground sm:px-6 lg:px-8">
          No exams published yet — check back soon.
        </p>
      ) : (
        <ExamsBrowser groups={groups} />
      )}
    </main>
  );
}
