import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { BrowsePracticeClient } from '@/components/browse/browse-practice-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Hash, ExternalLink, ScrollText } from 'lucide-react';
import type { TopicTreeNode } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await serverGet<{ exam: any; examSubjects: { id: string; name: string }[]; initialTopicTree: TopicTreeNode[] }>(`/api/public/exams/${encodeURIComponent(slug)}`);
    const exam = data.exam;
    if (!exam) return { title: 'Exam Not Found' };
    return {
      title: `${exam.name} MCQ Practice — Free`,
      description: exam.description
        ?? `Practice ${exam.name} MCQs sorted by subject and topic. Free, no sign-up required.`,
    };
  } catch {
    return { title: 'Exam Not Found' };
  }
}

export default async function ExamPracticePage({ params }: Props) {
  const { slug } = await params;

  const [data, session] = await Promise.all([
    serverGet<{ exam: any; examSubjects: { id: string; name: string }[]; initialTopicTree: TopicTreeNode[] }>(`/api/public/exams/${slug}`).catch(() => null),
    auth(),
  ]);

  if (!data?.exam) notFound();

  const { exam, examSubjects, initialTopicTree } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/exams" className="hover:text-foreground transition-colors">Exams</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{exam.name}</span>
      </nav>

      {/* Exam hero */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{exam.name}</h1>
              {exam.isFeatured && <Badge variant="secondary">Popular</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{exam.conductedBy}</p>
            {exam.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{exam.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>{(exam.mcqCount ?? 0).toLocaleString()} questions</span>
              </div>
              {examSubjects.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {examSubjects.map((s) => s.name).join(', ')}
                </span>
              )}
              {!session?.user && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  No login required
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`/pyp/${exam.slug}`}>
                <ScrollText className="h-3.5 w-3.5 mr-1.5" />
                Previous Year Papers
              </Link>
            </Button>
            {exam.officialWebsite && (
              <a
                href={exam.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Official Site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Practice client */}
      <BrowsePracticeClient
        examId={exam.id}
        examSubjects={examSubjects}
        initialTopicTree={initialTopicTree}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
