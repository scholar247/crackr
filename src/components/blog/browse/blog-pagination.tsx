import { LinkPagination } from '@/components/ui/link-pagination';
import { blogListHref } from '@/lib/blog-list-params';
import type { BlogListSort } from '@/server/repositories/article.repository';

interface BlogPaginationProps {
  basePath: string;
  sort: BlogListSort;
  page: number;
  totalPages: number;
}

export function BlogPagination({ basePath, sort, page, totalPages }: BlogPaginationProps) {
  return <LinkPagination page={page} totalPages={totalPages} href={(p) => blogListHref(basePath, { page: p, sort })} />;
}
