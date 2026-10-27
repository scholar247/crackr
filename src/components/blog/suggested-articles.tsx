import Link from 'next/link';
import { calcReadingTime } from '@/lib/reading-time';

interface SuggestedArticle {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  ogImage: string | null;
}

export function SuggestedArticles({ articles }: { articles: SuggestedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="text-lg font-semibold text-foreground">Suggested for you</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blogs/${article.slug}`}
            className="overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            {article.ogImage && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, matches blogs listing precedent
              <img src={article.ogImage} alt="" loading="lazy" className="aspect-video w-full object-cover" />
            )}
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{article.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{calcReadingTime(article.body)} min read</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
