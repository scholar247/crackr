import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { articleRepository } from '@/server/repositories/article.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { BlogContent } from '@/components/blog/blog-content';
import { AuthorCard } from '@/components/blog/author-card';
import { ReadingProgressBar } from '@/components/blog/reading-progress-bar';
import { ShareControls } from '@/components/blog/share-controls';
import { TableOfContentsDesktop, TableOfContentsMobile } from '@/components/blog/table-of-contents';
import { ConceptCheckCard } from '@/components/blog/concept-check-card';
import { SuggestedArticles } from '@/components/blog/suggested-articles';
import { BackToTopButton } from '@/components/blog/back-to-top-button';
import { extractHeadings } from '@/lib/toc';
import { calcReadingTime } from '@/lib/reading-time';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getArticle(slug: string) {
  const row = await articleRepository.findPublishedBySlugWithAuthor(slug);
  return row;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await getArticle(slug);
  if (!row) return {};

  const { article } = row;
  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.summary || undefined;

  return {
    title,
    description,
    keywords: article.keywords ?? undefined,
    alternates: { canonical: `/blogs/${article.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      images: article.ogImage ? [{ url: article.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: article.ogImage ? [article.ogImage] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getArticle(slug);
  if (!row) notFound();

  const { article, author } = row;
  const headings = extractHeadings(article.body);
  const url = `https://scholar247.org/blogs/${article.slug}`;

  // Curriculum tag (leaf + ancestors) drives both "related ground" queries below — no tag
  // means neither section has anything to match against, so both are skipped rather than
  // shown empty.
  const nodeIds = await articleRepository.findNodeIdsForArticle(article.id);
  const [conceptQuestion, suggested] = await Promise.all([
    nodeIds.length > 0 ? questionRepository.findRandomPublishedByNodes(nodeIds) : Promise.resolve(null),
    nodeIds.length > 0 ? articleRepository.findRelatedPublished(nodeIds, article.id, 4) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <ReadingProgressBar />

      {article.ogImage && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, matches author-avatar/blog-content precedent of skipping next/image for untrusted hosts
        <img
          src={article.ogImage}
          alt=""
          className="mx-auto aspect-[2/1] w-full max-w-3xl rounded-xl object-cover lg:max-w-none"
        />
      )}

      <div className={cn('grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]', article.ogImage && 'mt-8')}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{article.title}</h1>
          {article.summary && <p className="mt-3 text-lg text-muted-foreground">{article.summary}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">{calcReadingTime(article.body)} min read</p>
            <ShareControls url={url} title={article.title} />
          </div>
        </div>

        <AuthorCard
          authorId={author?.id}
          name={author?.name ?? 'Scholar'}
          imageUrl={author?.image}
          college={author?.college}
          degree={author?.degree}
          updatedAt={article.updatedAt.toISOString()}
        />
      </div>

      <div className="mt-8 lg:hidden">
        <TableOfContentsMobile headings={headings} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_220px]">
        <div>
          <BlogContent content={article.body} />

          {conceptQuestion && (
            <div className="mt-10">
              <ConceptCheckCard
                stem={conceptQuestion.stem}
                options={conceptQuestion.optionsJson}
                explanation={conceptQuestion.explanation}
                difficulty={conceptQuestion.difficulty}
              />
            </div>
          )}
        </div>
        <div className="hidden lg:block">
          <TableOfContentsDesktop headings={headings} />
        </div>
      </div>

      <SuggestedArticles articles={suggested} />
      <BackToTopButton />
    </main>
  );
}
