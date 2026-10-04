import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { getHeroSearchData } from '@/server/services/exam-explorer-data';
import { ExamsHero } from '@/components/marketing/exams/exams-hero';
import { ExamFinder, type FinderExam } from '@/components/marketing/exams/exam-finder';
import { WhatYouGet } from '@/components/marketing/exams/what-you-get';
import { CompareExams } from '@/components/marketing/exams/compare-exams';
import { RequestExamBand } from '@/components/marketing/exams/request-exam-band';

export const metadata: Metadata = {
  title: 'Exams',
  description:
    'Find your exam — browse programs, check the syllabus, and jump into topic-wise MCQ practice, previous-year questions and mock tests for NIMCET, GATE, CUET, CBSE and more.',
};
export const dynamic = 'force-dynamic';

interface ExamsPageProps {
  searchParams: Promise<{ q?: string; program?: string }>;
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const { q, program } = await searchParams;

  const [programs, examRows, summaries, platformStats] = await Promise.all([
    taxonomyRepository.listPublicPrograms(),
    taxonomyRepository.listPublicExams(),
    examSpotlightRepository.getAllExamSummaries(),
    examSpotlightRepository.getPlatformStats(),
  ]);

  const programSlugByName = new Map(programs.map((p) => [p.name, p.slug]));
  const exams: FinderExam[] = examRows.map(({ exam, programName }) => {
    const s = summaries[exam.id];
    return {
      id: exam.id,
      slug: exam.slug,
      name: exam.name,
      description: exam.description,
      programSlug: programSlugByName.get(programName) ?? '',
      programName,
      chapters: s?.chapters ?? 0,
      mcqs: s?.mcqs ?? 0,
      pyqs: s?.pyqs ?? 0,
      mockTests: s?.mockTests ?? 0,
    };
  });

  // Only programs that actually have an exam are worth a tab.
  const finderPrograms = programs.filter((p) => exams.some((e) => e.programSlug === p.slug)).map((p) => ({ slug: p.slug, name: p.name }));
  const richness = (e: FinderExam) => e.chapters + e.mcqs + e.pyqs * 2 + e.mockTests * 5;
  const mostComplete = [...exams].sort((a, b) => richness(b) - richness(a) || a.name.localeCompare(b.name)).slice(0, 3);

  const { searchExams, searchPrograms, popularExams } = getHeroSearchData(
    finderPrograms.map((p) => ({
      id: p.slug,
      slug: p.slug,
      name: p.name,
      description: null,
      exams: exams
        .filter((e) => e.programSlug === p.slug)
        .map((e) => ({ id: e.id, slug: e.slug, name: e.name, description: e.description })),
    })),
  );

  return (
    <main>
      <ExamsHero q={q?.trim()} exams={searchExams} programs={searchPrograms} popularExams={popularExams} stats={platformStats} />
      <ExamFinder
        programs={finderPrograms}
        exams={exams}
        initialProgram={finderPrograms.some((p) => p.slug === program) ? program : undefined}
        q={q}
      />
      <WhatYouGet
        totals={{
          chapters: exams.reduce((sum, e) => sum + e.chapters, 0),
          mcqs: platformStats.mcqs,
          pyqs: platformStats.pyqs,
          mockTests: platformStats.mockTests,
          exams: platformStats.exams,
        }}
      />
      <CompareExams exams={mostComplete} />
      <RequestExamBand />
    </main>
  );
}
