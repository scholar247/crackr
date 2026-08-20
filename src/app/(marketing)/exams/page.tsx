import type { Metadata } from 'next';
import Link from 'next/link';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { EXAM_STATS, DEFAULT_EXAM_STATS, computeExamInitials, type ExamCardData } from '@/lib/exam-stats';
import { HeroSearch } from '@/components/marketing/exams/hero-search';
import { ProgramBrowse } from '@/components/marketing/exams/program-browse';
import { PopularExamsSection } from '@/components/marketing/exams/popular-exams-section';
import { CompareExams } from '@/components/marketing/exams/compare-exams';
import { SeoContent } from '@/components/marketing/exams/seo-content';

export const metadata: Metadata = { title: 'Exams' };
export const dynamic = 'force-dynamic';

interface ExamsPageProps {
  searchParams: Promise<{ q?: string; program?: string; sort?: string }>;
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const { q, program, sort } = await searchParams;

  const [programs, examRows] = await Promise.all([
    taxonomyRepository.listPublicPrograms(),
    taxonomyRepository.listPublicExams(),
  ]);

  // Subject count per exam — real syllabus depth, used both for the "Subjects" stat and
  // for "popular" ranking (richest seeded syllabus first), same convention as the
  // homepage's featured-exam ranking.
  const subjectCounts = await Promise.all(
    examRows.map(async ({ exam }) => [exam.id, (await taxonomyRepository.getSyllabusTree(exam.id)).length] as const)
  );
  const subjectCountByExamId = new Map(subjectCounts);

  const programSlugByName = new Map(programs.map((p) => [p.name, p.slug]));
  const examNamesByProgram = examRows.reduce<Record<string, string[]>>((acc, { exam, programName }) => {
    (acc[programName] ??= []).push(exam.name);
    return acc;
  }, {});

  // programName travels alongside each card for filtering below (program matching needs
  // it) — a plain local type, not part of the shared ExamCardData shape that child
  // components receive.
  type ExamRow = ExamCardData & { programName: string };

  const taken = new Set<string>();
  const allExams: ExamRow[] = examRows.map(({ exam, programName }) => ({
    id: exam.id,
    slug: exam.slug,
    name: exam.name,
    description: exam.description,
    initials: computeExamInitials(exam.name, taken),
    stats: EXAM_STATS[exam.slug] ?? DEFAULT_EXAM_STATS,
    subjectCount: subjectCountByExamId.get(exam.id) ?? 0,
    programName,
  }));

  const rankedAll = [...allExams].sort(
    (a, b) => (subjectCountByExamId.get(b.id) ?? 0) - (subjectCountByExamId.get(a.id) ?? 0) || a.name.localeCompare(b.name)
  );

  const qLower = q?.trim().toLowerCase();

  let filtered = allExams.filter((exam) => {
    if (program && programSlugByName.get(exam.programName) !== program) return false;
    if (qLower) {
      const haystack = `${exam.name} ${exam.description ?? ''}`.toLowerCase();
      if (!haystack.includes(qLower)) return false;
    }
    return true;
  });

  filtered =
    sort === 'name'
      ? [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      : [...filtered].sort(
          (a, b) => (subjectCountByExamId.get(b.id) ?? 0) - (subjectCountByExamId.get(a.id) ?? 0) || a.name.localeCompare(b.name)
        );

  const trending = rankedAll.slice(0, 4).map((e) => e.name);
  const compareExams = rankedAll.slice(0, 3);
  const activeProgram = program ? programs.find((p) => p.slug === program) : undefined;

  const searchableExams = allExams.map((e) => ({ id: e.id, slug: e.slug, name: e.name, programName: e.programName }));
  const searchablePrograms = programs.map((p) => ({ id: p.id, slug: p.slug, name: p.name }));

  return (
    <main>
      <HeroSearch q={q} trending={trending} exams={searchableExams} programs={searchablePrograms} />

      {/* Browse by Program is the entry point for picking a program in the first place —
          once one is already selected via ?program=, showing it again is redundant; a
          slim "currently filtered" chip with a way back to the full list takes its place. */}
      {activeProgram ? (
        <div id="browse-by-program" className="border-b border-border bg-muted/40 py-5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 sm:px-6 lg:px-8">
            <span className="text-body-sm text-muted-foreground">Showing exams for</span>
            <span className="text-label-caps rounded-full border border-primary/30 bg-primary/10 px-3 py-1 uppercase text-primary">
              {activeProgram.name}
            </span>
            <Link href="/exams" className="text-body-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Clear
            </Link>
          </div>
        </div>
      ) : (
        <ProgramBrowse programs={programs} examNamesByProgram={examNamesByProgram} />
      )}

      <PopularExamsSection exams={filtered} searchParams={{ q, program, sort }} />
      <CompareExams exams={compareExams} />
      <SeoContent />
    </main>
  );
}
