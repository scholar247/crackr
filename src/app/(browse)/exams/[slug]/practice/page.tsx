import type { Metadata } from 'next';
import { ExamPracticePage, generateExamPracticeMetadata } from '@/components/exams/exam-practice-page';

interface ExamPracticeRouteProps {
  params: Promise<{ slug: string }>;
}

/**
 * Always-on practice URL for every exam, independent of whether `/exams/[slug]`
 * itself is currently rendering a custom landing page or the generic fallback.
 * Custom landing pages' "start practicing" CTAs link here instead of scrolling
 * to an embedded widget, so the link never breaks if a landing page changes.
 */
export async function generateMetadata({ params }: ExamPracticeRouteProps): Promise<Metadata> {
  const { slug } = await params;
  return generateExamPracticeMetadata(slug, `/exams/${slug}/practice`);
}

export default async function ExamPracticeRoute({ params }: ExamPracticeRouteProps) {
  const { slug } = await params;
  return <ExamPracticePage slug={slug} />;
}
