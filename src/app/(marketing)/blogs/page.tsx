import Link from 'next/link';
import type { Metadata } from 'next';
import { articleRepository } from '@/server/repositories/article.repository';
import { calcReadingTime } from '@/lib/reading-time';

export const metadata: Metadata = { title: 'Blog' };
export const dynamic = 'force-dynamic';

export default async function BlogsPage() {
  const articles = await articleRepository.findPublished();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Blog</h1>
      <p className="mt-2 text-muted-foreground">Guides and explanations to go along with your exam prep.</p>

      {articles.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No articles published yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blogs/${article.slug}`}
              className="overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              {article.ogImage && (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, matches author-avatar/blog-content precedent of skipping next/image for untrusted hosts
                <img
                  src={article.ogImage}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="p-5">
                <h2 className="font-semibold text-foreground">{article.title}</h2>
                {article.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>}
                <p className="mt-3 text-xs text-muted-foreground">{calcReadingTime(article.body)} min read</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
