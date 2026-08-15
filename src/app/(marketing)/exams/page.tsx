import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { EXAM_STATS, DEFAULT_EXAM_STATS, computeExamInitials, type ExamCardData } from '@/lib/exam-stats';
import { EXAM_CATEGORIES } from '@/components/marketing/exams/category-browse';
import { HeroSearch } from '@/components/marketing/exams/hero-search';
import { CategoryBrowse } from '@/components/marketing/exams/category-browse';
import { PopularExamsSection } from '@/components/marketing/exams/popular-exams-section';
import { GoalPrograms } from '@/components/marketing/exams/goal-programs';
import { CompareExams } from '@/components/marketing/exams/compare-exams';
import { SeoContent } from '@/components/marketing/exams/seo-content';

export const metadata: Metadata = { title: 'Exams' };
export const dynamic = 'force-dynamic';

interface ExamsPageProps {
  searchParams: Promise<{ q?: string; category?: string; program?: string; sort?: string }>;
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const { q, category, program, sort } = await searchParams;

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

  // programName travels alongside each card for filtering below (category/program
  // matching need it) — a plain local type, not part of the shared ExamCardData shape
  // that child components receive.
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

  const categoryDef = EXAM_CATEGORIES.find((c) => c.id === category);
  const qLower = q?.trim().toLowerCase();

  let filtered = allExams.filter((exam) => {
    if (program && programSlugByName.get(exam.programName) !== program) return false;
    if (categoryDef) {
      const haystack = `${exam.name} ${exam.description ?? ''} ${exam.programName}`.toLowerCase();
      if (!haystack.includes(categoryDef.keyword)) return false;
    }
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

  return (
    <main>
      <HeroSearch q={q} trending={trending} />
      <CategoryBrowse active={category} />
      <PopularExamsSection exams={filtered} searchParams={{ q, category, program, sort }} />
      <GoalPrograms programs={programs} examNamesByProgram={examNamesByProgram} />
      <CompareExams exams={compareExams} />
      <SeoContent />
    </main>
  );
}
