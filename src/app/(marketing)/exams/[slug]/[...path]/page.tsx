import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { getExamLanding } from '@/components/exam-landing/registry';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ExamSubpageProps {
  params: Promise<{ slug: string; path: string[] }>;
}

// Inner pages of an exam with a purpose-built landing (e.g. /exams/nimcet/syllabus). Only
// exams in the landing registry have them, and only paths that registry entry resolves;
// everything else 404s rather than falling back to a generic page.
function resolve(slug: string, path: string[]) {
  return getExamLanding(slug)?.subpage?.(path) ?? null;
}

async function findActiveExam(slug: string) {
  const exam = await taxonomyRepository.findExamBySlug(slug);
  return exam && exam.status === 'ACTIVE' ? exam : null;
}

export async function generateMetadata({ params }: ExamSubpageProps): Promise<Metadata> {
  const { slug, path } = await params;
  const page = resolve(slug, path);
  if (!page || !(await findActiveExam(slug))) return {};
  return page.metadata;
}

export default async function ExamSubpage({ params }: ExamSubpageProps) {
  const { slug, path } = await params;
  const page = resolve(slug, path);
  if (!page) notFound();

  const [exam, session] = await Promise.all([findActiveExam(slug), auth()]);
  if (!exam) notFound();
  return page.render(exam, { userId: session?.user?.id ?? null });
}
