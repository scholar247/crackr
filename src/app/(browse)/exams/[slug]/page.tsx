import type { Metadata } from 'next';
import { ExamLandingGate } from '@/components/exams/exam-landing-gate';
import { generateExamPracticeMetadata } from '@/components/exams/exam-practice-page';
import { getExamLandingEntry } from '@/components/exams/landing/registry';

interface ExamPageProps {
  params: Promise<{ slug: string }>;
}

// No exam-specific logic here by design — this route only knows how to read
// `slug` and hand off. Which exams get a custom page, and what that page
// looks like, is entirely owned by the landing registry + gate.
export async function generateMetadata({ params }: ExamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getExamLandingEntry(slug);
  return entry ? entry.loadMetadata() : generateExamPracticeMetadata(slug);
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { slug } = await params;
  return <ExamLandingGate slug={slug} />;
}
