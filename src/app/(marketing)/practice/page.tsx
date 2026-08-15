import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { EXAM_STATS, DEFAULT_EXAM_STATS, computeExamInitials } from '@/lib/exam-stats';
import { Hero } from '@/components/marketing/practice/hero';
import { TodaysPractice } from '@/components/marketing/practice/todays-practice';
import { PracticeModes } from '@/components/marketing/practice/practice-modes';
import { TargetedExamPractice } from '@/components/marketing/practice/targeted-exam-practice';
import { PracticeInsight } from '@/components/marketing/practice/practice-insight';

export const metadata: Metadata = {
  title: 'Practice',
  description: 'Targeted question sets, subject-wise drills, and previous year papers for high-stakes exam preparation.',
};

export const dynamic = 'force-dynamic';

async function getTargetedExams() {
  const examRows = await taxonomyRepository.listPublicExams();

  // Same "richest seeded syllabus wins" ranking used on /exams and the homepage.
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
    .slice(0, 4)
    .map(({ exam, programName }) => ({
      id: exam.id,
      slug: exam.slug,
      name: exam.name,
      description: exam.description,
      initials: computeExamInitials(exam.name, taken),
      stats: EXAM_STATS[exam.slug] ?? DEFAULT_EXAM_STATS,
      categoryTag: programName.split(' ')[0],
    }));
}

export default async function PracticePage() {
  const exams = await getTargetedExams();

  return (
    <main>
      <Hero />
      <TodaysPractice />
      <PracticeModes />
      <TargetedExamPractice exams={exams} />
      <PracticeInsight />
    </main>
  );
}
