import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { articleRepository } from '@/server/repositories/article.repository';
import { BLOGS_PAGE_SIZE } from '@/server/services/blog-browse';
import { blogListHref, parseBlogListParams } from '@/lib/blog-list-params';
import { BlogCard } from '@/components/blog/browse/blog-card';
import { BlogSidebar, type SidebarItem } from '@/components/blog/browse/blog-sidebar';
import { BlogSortSelect } from '@/components/blog/browse/blog-sort-select';
import { BlogPagination } from '@/components/blog/browse/blog-pagination';

interface BlogBrowseViewProps {
  breadcrumbs?: { label: string; href?: string }[];
  title: string;
  description: string;
  /** Restricts the listing: an exam, a curriculum node, or neither (all blogs). */
  scope?: { examId?: string; nodeId?: string };
  /** This page's own path, used for pagination and sort links. */
  basePath: string;
  searchParams: { page?: string; sort?: string };
  sidebar: { title: string; items: SidebarItem[]; back?: { label: string; href: string }; emptyText?: string };
  emptyText: string;
}

// One listing layout for /blogs and every exam/subject/chapter/topic page under it: a
// drill-down table on the left, the paginated list on the right, sort dropdown top-right.
export async function BlogBrowseView({ breadcrumbs = [], title, description, scope, basePath, searchParams, sidebar, emptyText }: BlogBrowseViewProps) {
  const { sort, page } = parseBlogListParams(searchParams);
  const { items, total } = await articleRepository.listPublishedPage({ ...scope, sort, page, pageSize: BLOGS_PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / BLOGS_PAGE_SIZE));

  // A stale link past the last page lands on the last page instead of an empty list.
  if (total > 0 && page > totalPages) redirect(blogListHref(basePath, { page: totalPages, sort }));

  return (
    <main className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <BlogSidebar {...sidebar} />

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total === 0 ? 'No articles' : `${total} ${total === 1 ? 'article' : 'articles'}`}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
            <BlogSortSelect value={sort} />
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {items.map((article) => (
                <BlogCard key={article.id} article={article} />
              ))}
            </div>
          )}

          <BlogPagination basePath={basePath} sort={sort} page={page} totalPages={totalPages} />
        </section>
      </div>
    </main>
  );
}
