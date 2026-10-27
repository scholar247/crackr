import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { blogListHref } from '@/lib/blog-list-params';
import type { BlogListSort } from '@/server/repositories/article.repository';
import { cn } from '@/lib/utils';

function pageWindow(current: number, total: number): (number | 'gap')[] {
  const pages: (number | 'gap')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push('gap');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('gap');
  if (total > 1) pages.push(total);
  return pages;
}

interface BlogPaginationProps {
  basePath: string;
  sort: BlogListSort;
  page: number;
  totalPages: number;
}

// Plain links (not client state) so every page is a crawlable, shareable URL.
export function BlogPagination({ basePath, sort, page, totalPages }: BlogPaginationProps) {
  if (totalPages <= 1) return null;
  const href = (p: number) => blogListHref(basePath, { page: p, sort });
  const itemCls = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors';

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(itemCls, 'border-border hover:bg-muted')}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Link>
      ) : (
        <span className={cn(itemCls, 'border-border opacity-40')}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(itemCls, p === page ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={cn(itemCls, 'border-border hover:bg-muted')}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(itemCls, 'border-border opacity-40')}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
