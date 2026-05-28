import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Hash, Calendar } from 'lucide-react';
import { PYPPracticeClient } from '@/components/browse/pyp-practice-client';
import type { ExamClient, PYPClient } from '@/types';

interface Props { params: Promise<{ examSlug: string; pypSlug: string }> }

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug, pypSlug } = await params;
  try {
    const [examData, pyps] = await Promise.all([
      serverGet<{ exam: ExamClient }>(`/api/public/exams/${examSlug}`),
      serverGet<PYPClient[]>(`/api/public/pyp?examSlug=${examSlug}`),
    ]);
    const pyp = pyps.find((p) => p.slug === pypSlug);
    if (!pyp) return { title: 'PYP Not Found' };
    return {
      title: `${pyp.title} — ${examData.exam.name} MCQ Practice`,
      description: `Practice ${pyp.mcqCount} questions from ${pyp.title}. Free MCQ practice with explanations.`,
    };
  } catch {
    return { title: 'PYP Practice' };
  }
}

export default async function PYPPracticePage({ params }: Props) {
  const { examSlug, pypSlug } = await params;

  const [examData, pyps, session] = await Promise.all([
    serverGet<{ exam: ExamClient }>(`/api/public/exams/${examSlug}`).catch(() => null),
    serverGet<PYPClient[]>(`/api/public/pyp?examSlug=${examSlug}`).catch(() => [] as PYPClient[]),
    auth(),
  ]);

  if (!examData?.exam) notFound();

  const pyp = pyps.find((p) => p.slug === pypSlug);
  if (!pyp) notFound();

  const exam = examData.exam;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/pyp" className="hover:text-foreground transition-colors">PYP</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pyp/${examSlug}`} className="hover:text-foreground transition-colors">{exam.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{MONTH_NAMES[pyp.month]} {pyp.year}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{pyp.title}</h1>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {MONTH_NAMES[pyp.month]} {pyp.year}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{exam.name} · {exam.conductedBy}</p>
            {pyp.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{pyp.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>{pyp.mcqCount.toLocaleString()} questions</span>
              </div>
              {!session?.user && (
                <Badge variant="outline" className="text-xs text-muted-foreground">No login required</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Practice client */}
      <PYPPracticeClient
        pypId={pyp.id}
        examId={exam.id}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
