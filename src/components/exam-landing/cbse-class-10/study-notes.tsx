import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogCard } from '@/components/blog/browse/blog-card';
import { EmptyState } from '@/components/exam-landing/shared/empty-state';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';

interface NoteArticle {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  ogImage: string | null;
  body: string;
}

export function StudyNotes({ articles, notesHref, practiceHref }: { articles: NoteArticle[]; notesHref: string; practiceHref: string }) {
  return (
    <LandingSection id="notes" muted>
      <SectionHeader
        eyebrow="Study material"
        icon={<BookOpen className="h-3.5 w-3.5" />}
        title="Chapter notes and guides"
        description="Short explanations, solved examples and revision notes mapped to the Class 10 syllabus."
        action={
          articles.length > 0 && (
            <Link href={notesHref} className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary hover:text-primary/80">
              Browse all notes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )
        }
      />

      <div className="mt-8">
        {articles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <BlogCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="Notes are on the way"
            description="We're writing chapter-wise notes for Class 10. Until then, practise questions — every one comes with a worked solution."
            action={
              <Button size="sm" className="rounded-full" asChild>
                <Link href={practiceHref}>Practise with solutions</Link>
              </Button>
            }
          />
        )}
      </div>
    </LandingSection>
  );
}
