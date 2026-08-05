import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { articleRepository } from '@/server/repositories/article.repository';
import { BlogContent } from '@/components/blog/blog-content';
import { AuthorByline } from '@/components/blog/author-byline';
import { ReadingProgressBar } from '@/components/blog/reading-progress-bar';
import { ShareControls } from '@/components/blog/share-controls';
import { TableOfContentsDesktop, TableOfContentsMobile } from '@/components/blog/table-of-contents';
import { extractHeadings } from '@/lib/toc';
import { calcReadingTime } from '@/lib/reading-time';

export const revalidate = 60;

async function getArticle(slug: string) {
  const row = await articleRepository.findPublishedBySlugWithAuthor(slug);
  return row;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await getArticle(slug);
  if (!row) return {};

  return {
    title: row.article.title,
    description: row.article.summary ?? undefined,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getArticle(slug);
  if (!row) notFound();

  const { article, author } = row;
  const headings = extractHeadings(article.body);
  const url = `https://scholar247.org/blogs/${article.slug}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <ReadingProgressBar />

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{article.title}</h1>
        {article.summary && <p className="mt-3 text-lg text-muted-foreground">{article.summary}</p>}

        <div className="mt-6 flex items-center justify-between gap-4">
          <AuthorByline
            name={author?.name ?? 'scholar247'}
            imageUrl={author?.image ?? undefined}
            updatedAt={article.updatedAt.toISOString()}
          />
          <ShareControls url={url} title={article.title} />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{calcReadingTime(article.body)} min read</p>

        <TableOfContentsMobile headings={headings} />
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-10 lg:mx-0 lg:max-w-none lg:grid-cols-[1fr_220px]">
        <div className="mx-auto w-full max-w-3xl lg:mx-0">
          <BlogContent content={article.body} />
        </div>
        <div className="hidden lg:block">
          <TableOfContentsDesktop headings={headings} />
        </div>
      </div>
    </main>
  );
}
