import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { BrowsePracticeClient } from '@/components/browse/browse-practice-client';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Hash, Layers } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await serverGet<{ subject: any; topicTree: any[] }>(`/api/public/subjects/${encodeURIComponent(slug)}`);
    const subject = data.subject;
    if (!subject) return { title: 'Subject Not Found' };
    return {
      title: `${subject.name} MCQs — Practice Free`,
      description: subject.description
        ?? `Practice ${subject.name} MCQs with topic-wise filtering. Free, no account needed.`,
    };
  } catch {
    return { title: 'Subject Not Found' };
  }
}

export default async function SubjectPracticePage({ params }: Props) {
  const { slug } = await params;

  const [data, session] = await Promise.all([
    serverGet<{ subject: any; topicTree: any[] }>(`/api/public/subjects/${slug}`).catch(() => null),
    auth(),
  ]);

  if (!data?.subject) notFound();

  const { subject, topicTree } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/subjects" className="hover:text-foreground transition-colors">Subjects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{subject.name}</span>
      </nav>

      {/* Subject hero */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
          {subject.description && (
            <p className="mt-1.5 text-muted-foreground max-w-2xl text-sm">{subject.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span>{(subject.mcqCount ?? 0).toLocaleString()} questions</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>{subject.topicCount ?? 0} topics</span>
            </div>
            {!session?.user && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                No login required
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Practice client */}
      <BrowsePracticeClient
        subjectId={subject.id}
        initialTopicTree={topicTree}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
