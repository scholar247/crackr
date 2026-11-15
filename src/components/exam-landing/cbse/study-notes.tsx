import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogCard } from '@/components/blog/browse/blog-card';
import { EmptyState } from '@/components/exam-landing/shared/empty-state';

interface NoteArticle {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  ogImage: string | null;
  body: string;
}

// Note cards, or an empty state that sends the student to practice (every question has a
// worked solution) until notes are published.
export function NotesGrid({ articles, classLabel, practiceHref }: { articles: NoteArticle[]; classLabel: string; practiceHref: string }) {
  if (articles.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-5 w-5" />}
        title="Notes are on the way"
        description={`We're writing chapter-wise notes for ${classLabel}. Until then, practise questions — every one comes with a worked solution.`}
        action={
          <Button size="sm" className="rounded-full" asChild>
            <Link href={practiceHref}>Practise with solutions</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => (
        <BlogCard key={a.id} article={a} />
      ))}
    </div>
  );
}
