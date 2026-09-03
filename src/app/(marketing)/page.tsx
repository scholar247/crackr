import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { EXAM_STATS, DEFAULT_EXAM_STATS, computeExamInitials } from '@/lib/exam-stats';
import type { ExamCardData } from '@/lib/exam-stats';
import { PRIMARY_EXAM_SLUGS } from '@/lib/primary-exams';
import { Hero } from '@/components/marketing/home/hero';
import { FeatureStrip } from '@/components/marketing/home/feature-strip';
import { ExploreExams } from '@/components/marketing/home/explore-exams';
import { MasterConcepts } from '@/components/marketing/home/master-concepts';
import { PracticeShowcase } from '@/components/marketing/home/practice-showcase';
import { FrameworkSteps } from '@/components/marketing/home/framework-steps';
import { Team } from '@/components/marketing/home/team';
import { CtaBand } from '@/components/marketing/home/cta-band';

export const metadata: Metadata = {
  title: 'NIMCET, GATE, CUET & CBSE Prep',
  description:
    'Prep for NIMCET, GATE-CSE, CUET-UG and CBSE boards with structured theory, PYQs, MCQ practice and mock tests — built by engineers who took these exams themselves.',
};

export const dynamic = 'force-dynamic';

async function getFeaturedExams(): Promise<ExamCardData[]> {
  const examRows = await taxonomyRepository.listPublicExams();

  // Same "richest seeded syllabus wins" ranking used on /exams, so the exam
  // featured here matches the one featured there rather than picking arbitrarily.
  const subjectCounts = await Promise.all(
    examRows.map(async ({ exam }) => [exam.id, (await taxonomyRepository.getSyllabusTree(exam.id)).length] as const)
  );
  const subjectCountByExamId = new Map(subjectCounts);

  // The homepage deliberately leads with a curated set (see primary-exams.ts) instead of
  // leaving the featured lineup entirely to incidental syllabus richness — otherwise which
  // exams get top billing silently shifts as content gets seeded. Primary exams keep
  // PRIMARY_EXAM_SLUGS order; remaining slots fall back to richest-syllabus-first.
  const primaryIndex = new Map<string, number>(PRIMARY_EXAM_SLUGS.map((slug, i) => [slug, i]));
  const ranked = [...examRows].sort((a, b) => {
    const aPrimary = primaryIndex.get(a.exam.slug);
    const bPrimary = primaryIndex.get(b.exam.slug);
    if (aPrimary !== undefined || bPrimary !== undefined) {
      if (aPrimary === undefined) return 1;
      if (bPrimary === undefined) return -1;
      return aPrimary - bPrimary;
    }
    return (
      (subjectCountByExamId.get(b.exam.id) ?? 0) - (subjectCountByExamId.get(a.exam.id) ?? 0) ||
      a.exam.name.localeCompare(b.exam.name)
    );
  });

  const taken = new Set<string>();
  return ranked.slice(0, 5).map(({ exam }) => ({
    id: exam.id,
    slug: exam.slug,
    name: exam.name,
    description: exam.description,
    initials: computeExamInitials(exam.name, taken),
    stats: EXAM_STATS[exam.slug] ?? DEFAULT_EXAM_STATS,
  }));
}

export default async function HomePage() {
  const exams = await getFeaturedExams();

  return (
    <main>
      <Hero />
      <FeatureStrip />
      <ExploreExams exams={exams} />
      <MasterConcepts />
      <PracticeShowcase />
      <FrameworkSteps />
      <Team />
      <CtaBand />
    </main>
  );
}
