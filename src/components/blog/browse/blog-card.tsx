import Link from 'next/link';
import { calcReadingTime } from '@/lib/reading-time';

interface BlogCardProps {
  article: { slug: string; title: string; summary: string | null; ogImage: string | null; body: string };
}

export function BlogCard({ article }: BlogCardProps) {
  return (
    <Link
      href={`/blogs/${article.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      {article.ogImage && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, matches author-avatar/blog-content precedent of skipping next/image for untrusted hosts
        <img src={article.ogImage} alt="" loading="lazy" className="aspect-video w-full object-cover" />
      )}
      <div className="p-5">
        <h2 className="font-semibold text-foreground">{article.title}</h2>
        {article.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>}
        <p className="mt-3 text-xs text-muted-foreground">{calcReadingTime(article.body)} min read</p>
      </div>
    </Link>
  );
}
