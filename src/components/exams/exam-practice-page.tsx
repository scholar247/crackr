import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Session } from 'next-auth';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { BrowsePracticeClient } from '@/components/browse/browse-practice-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Hash, ExternalLink, ScrollText } from 'lucide-react';
import type { ExamClient, TopicTreeNode } from '@/types';

interface ExamApiResponse {
  exam: ExamClient;
  examSubjects: { id: string; name: string }[];
  initialTopicTree: TopicTreeNode[];
}

async function loadExamPracticeData(slug: string) {
  const [data, session] = await Promise.all([
    serverGet<ExamApiResponse>(`/api/public/exams/${encodeURIComponent(slug)}`).catch(() => null),
    auth(),
  ]);
  return { data, session };
}

function ExamPracticeBody({ data, session }: { data: ExamApiResponse; session: Session | null }) {
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

/**
 * The generic, data-driven practice experience every exam gets "for free" —
 * this is what `ExamLandingGate` renders when a slug has no custom landing
 * page registered. A missing exam is a real 404 here: this component *is*
 * the whole route.
 */
export async function ExamPracticePage({ slug }: { slug: string }) {
  const { data, session } = await loadExamPracticeData(slug);
  if (!data?.exam) notFound();
  return <ExamPracticeBody data={data} session={session} />;
}

/**
 * Metadata for `ExamPracticePage`. Lives next to it (rather than in a page.tsx)
 * so the two never drift apart — same data source, same shape, one file to
 * update if the API response changes. `canonicalPath` differs by caller:
 * `/exams/[slug]/page.tsx` uses this for the fallback (no custom landing)
 * case, `/exams/[slug]/practice/page.tsx` uses it for the always-on practice
 * route that custom landing pages link their CTAs to.
 */
export async function generateExamPracticeMetadata(
  slug: string,
  canonicalPath: string = `/exams/${slug}`
): Promise<Metadata> {
  try {
    const data = await serverGet<ExamApiResponse>(`/api/public/exams/${encodeURIComponent(slug)}`);
    const exam = data.exam;
    if (!exam) return { title: 'Exam Not Found' };
    return {
      title: `${exam.name} MCQ Practice — Free`,
      description: exam.description
        ?? `Practice ${exam.name} MCQs sorted by subject and topic. Free, no sign-up required.`,
      alternates: { canonical: canonicalPath },
    };
  } catch {
    return { title: 'Exam Not Found' };
  }
}
