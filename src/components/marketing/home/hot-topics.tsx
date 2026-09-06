'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { NotebookPen, ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calcReadingTime } from '@/lib/reading-time';

interface HotTopicArticle {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  isFeatured: boolean;
}

interface HotTopicsProps {
  articles: HotTopicArticle[];
  examName: string;
}

// Section 7.4, revised — a horizontal-scroll carousel (native overflow-x + scroll-snap,
// no carousel library: the whole thing is a handful of cards, dependency overkill for
// that). Featured articles (an editorial pin, see articles.isFeatured) lead the strip,
// backfilled with the most recent — never labeled "Hot"/"Trending", there's no view/upvote
// signal on articles to earn that claim, only recency + an explicit editorial flag.
export function HotTopics({ articles, examName }: HotTopicsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (articles.length === 0) return null;

  function scrollBy(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  return (
    <section className="bg-surface-container-lowest py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary">
              <NotebookPen className="h-3.5 w-3.5" /> Latest for {examName}
            </span>
            <h2 className="text-headline-lg mt-1 text-foreground">Fresh Reading</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/blogs"
              className="text-label-caps hidden shrink-0 items-center gap-1.5 uppercase tracking-wider text-primary transition-colors hover:text-primary/80 sm:flex"
            >
              All Articles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="hidden gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Scroll left"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Scroll right"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blogs/${article.slug}`}
              className="group flex w-64 shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:rotate-[-0.5deg] hover:shadow-lg"
            >
              {article.isFeatured && (
                <Badge variant="warning" className="mb-2 w-fit gap-1">
                  <Star className="h-3 w-3" /> Featured
                </Badge>
              )}
              <h3 className="text-body-md line-clamp-2 font-semibold text-foreground">{article.title}</h3>
              {article.summary && <p className="text-body-sm mt-2 line-clamp-2 text-muted-foreground">{article.summary}</p>}
              <p className="text-body-sm mt-3 text-muted-foreground">{calcReadingTime(article.body)} min read</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
