import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole, isAdmin } from '@/lib/roles';
import { articleRepository } from '@/server/repositories/article.repository';
import { BlogContent } from '@/components/blog/blog-content';
import { AuthorByline } from '@/components/blog/author-byline';
import { TableOfContentsDesktop, TableOfContentsMobile } from '@/components/blog/table-of-contents';
import { extractHeadings } from '@/lib/toc';
import { calcReadingTime } from '@/lib/reading-time';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, parseContentId } from '@/lib/utils';

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'TEACHER')) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const articleId = parseContentId(id);
  if (articleId === null) notFound();

  const row = await articleRepository.findByIdWithAuthor(articleId);
  if (!row) notFound();

  const { article, author } = row;
  if (!isAdmin(session.user.role) && article.authorId !== session.user.id) {
    redirect('/admin/blog');
  }

  const headings = extractHeadings(article.body);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mx-auto mb-8 flex max-w-3xl items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
        <Badge className={STATUS_COLORS[article.status]}>{article.status.replace('_', ' ')}</Badge>
        Preview only — this is how the article will look once published. It isn&apos;t the live URL.
      </div>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{article.title}</h1>
        {article.summary && <p className="mt-3 text-lg text-muted-foreground">{article.summary}</p>}

        <div className="mt-6">
          <AuthorByline
            name={author?.name ?? 'scholar247'}
            imageUrl={author?.image ?? undefined}
            updatedAt={article.updatedAt.toISOString()}
          />
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
