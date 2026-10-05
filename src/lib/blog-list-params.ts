import type { BlogListSort } from '@/server/repositories/article.repository';

export const BLOG_SORT_OPTIONS: { value: BlogListSort; label: string }[] = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title (A–Z)' },
];

export function parseBlogListParams(sp: { page?: string; sort?: string }) {
  const sort: BlogListSort = BLOG_SORT_OPTIONS.some((o) => o.value === sp.sort) ? (sp.sort as BlogListSort) : 'latest';
  const parsed = Number.parseInt(sp.page ?? '1', 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  return { sort, page };
}

/** Query string for a listing page; defaults (page 1, latest) are omitted to keep URLs clean. */
export function blogListHref(basePath: string, { page, sort }: { page: number; sort: BlogListSort }) {
  const qs = new URLSearchParams();
  if (sort !== 'latest') qs.set('sort', sort);
  if (page > 1) qs.set('page', String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}
