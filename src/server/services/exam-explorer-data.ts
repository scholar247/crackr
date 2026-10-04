import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { FEATURED_ANONYMOUS_EXAM_SLUG, PRIMARY_EXAM_SLUGS } from '@/lib/primary-exams';
import type { ExplorerProgram } from '@/components/marketing/home/exam-explorer';

// Programs → exams for the homepage "Target your exam" explorer, plus the preselected exam's real
// stats and daily problem so the section renders fully populated on first
// paint. Programs with no active exams are dropped.
export async function getExamExplorerData() {
  const [programRows, examRows] = await Promise.all([taxonomyRepository.listPublicPrograms(), taxonomyRepository.listPublicExams()]);

  const programs: ExplorerProgram[] = programRows
    .map((program) => ({
      id: program.id,
      slug: program.slug,
      name: program.name,
      description: program.description,
      exams: examRows
        .filter(({ exam }) => exam.programId === program.id)
        .map(({ exam }) => ({ id: exam.id, slug: exam.slug, name: exam.name, description: exam.description })),
    }))
    .filter((program) => program.exams.length > 0);
  if (programs.length === 0) return null;

  const allExams = programs.flatMap((p) => p.exams);
  const initialExam = allExams.find((e) => e.slug === FEATURED_ANONYMOUS_EXAM_SLUG) ?? allExams[0];
  const initialProgram = programs.find((p) => p.exams.some((e) => e.slug === initialExam.slug)) ?? programs[0];

  const [initialSpotlight, initialProgramStats] = await Promise.all([
    examSpotlightRepository.getSpotlight(initialExam.id),
    examSpotlightRepository.getProgramStats(initialProgram.id),
  ]);

  return { programs, initialExamSlug: initialExam.slug, initialSpotlight, initialProgramId: initialProgram.id, initialProgramStats };
}

// What the hero search box and "Popular" chips need, derived from the same program/exam list.
export function getHeroSearchData(programs: ExplorerProgram[]) {
  const searchExams = programs.flatMap((p) => p.exams.map((e) => ({ id: e.id, slug: e.slug, name: e.name, programName: p.name })));
  const searchPrograms = programs.map((p) => ({ id: p.id, slug: p.slug, name: p.name }));

  // Featured exam first, then the curated lineup, then anything else.
  const order: string[] = [FEATURED_ANONYMOUS_EXAM_SLUG, ...PRIMARY_EXAM_SLUGS];
  const popularExams = [...searchExams]
    .sort((a, b) => {
      const ai = order.indexOf(a.slug);
      const bi = order.indexOf(b.slug);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 5)
    .map(({ slug, name }) => ({ slug, name }));

  return { searchExams, searchPrograms, popularExams };
}
