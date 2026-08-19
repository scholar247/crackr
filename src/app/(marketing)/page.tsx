import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { EXAM_STATS, DEFAULT_EXAM_STATS, computeExamInitials } from '@/lib/exam-stats';
import type { ExamCardData } from '@/lib/exam-stats';
import { Hero } from '@/components/marketing/home/hero';
import { FeatureStrip } from '@/components/marketing/home/feature-strip';
import { ExploreExams } from '@/components/marketing/home/explore-exams';
import { MasterConcepts } from '@/components/marketing/home/master-concepts';
import { PracticeShowcase } from '@/components/marketing/home/practice-showcase';
import { FrameworkSteps } from '@/components/marketing/home/framework-steps';
import { CtaBand } from '@/components/marketing/home/cta-band';
import { SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Learn, Practice, Progress, Crack Exams`,
  description:
    'The smartest way to prepare for competitive exams. Practice curated question banks, follow structured curricula, and track your progress.',
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

  const taken = new Set<string>();
  return [...examRows]
    .sort(
      (a, b) =>
        (subjectCountByExamId.get(b.exam.id) ?? 0) - (subjectCountByExamId.get(a.exam.id) ?? 0) ||
        a.exam.name.localeCompare(b.exam.name)
    )
    .slice(0, 5)
    .map(({ exam }) => ({
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
      <CtaBand />
    </main>
  );
}
