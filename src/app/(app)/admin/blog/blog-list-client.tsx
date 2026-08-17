'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { STATUS_COLORS } from '@/lib/utils';
import { ARTICLE_STATUS_VALUES } from '@/schemas/article.schema';
import { isAdmin, type UserRole } from '@/lib/roles';

const ALL = 'all';

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  updatedAt: string;
}

interface ArticlesResponse {
  data: ArticleRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Author {
  id: string;
  name: string | null;
  email: string;
}

async function fetchArticles(params: URLSearchParams): Promise<ArticlesResponse> {
  const res = await fetch(`/api/v1/admin/blog?${params}`);
  if (!res.ok) throw new Error('Failed to load articles');
  return res.json();
}

async function fetchAuthors(): Promise<Author[]> {
  const res = await fetch('/api/v1/admin/blog/authors');
  if (!res.ok) throw new Error('Failed to load authors');
  return (await res.json()).data;
}

export function BlogListClient({ role }: { role: UserRole }) {
  const canBulkEdit = isAdmin(role);

  // Default: draft articles only, newest first, 10 per page.
  const [statusFilter, setStatusFilter] = useState<string>('DRAFT');
  const [authorFilter, setAuthorFilter] = useState<string>(ALL);
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<(typeof ARTICLE_STATUS_VALUES)[number]>('PUBLISHED');
  const [applying, setApplying] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter !== ALL) params.set('status', statusFilter);
  if (authorFilter !== ALL) params.set('authorId', authorFilter);
  params.set('sort', sort);
  params.set('page', String(page));
  params.set('limit', String(pageSize));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-blog', statusFilter, authorFilter, sort, page, pageSize],
    queryFn: () => fetchArticles(params),
  });
  const { data: authors } = useQuery({ queryKey: ['admin-blog-authors'], queryFn: fetchAuthors });

  const articles = data?.data ?? [];
  const meta = data?.meta;

  function resetPaging() {
    setPage(1);
    setSelected(new Set());
  }

  function handleStatusChange(v: string) {
    setStatusFilter(v);
    resetPaging();
  }

  function handleAuthorChange(v: string) {
    setAuthorFilter(v);
    resetPaging();
  }

  function handleSortChange(v: string) {
    setSort(v === 'asc' ? 'asc' : 'desc');
    resetPaging();
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    resetPaging();
  }

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === articles.length ? new Set() : new Set(articles.map((a) => a.id))));
  };

  const applyBulkStatus = async () => {
    setApplying(true);
    const res = await fetch('/api/v1/admin/blog/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkTarget }),
    });
    setApplying(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err.error as string) ?? 'Bulk update failed');
      return;
    }
    toast.success(`${selected.size} article${selected.size === 1 ? '' : 's'} updated`);
    setSelected(new Set());
    await refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Blog</h1>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" /> New article
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FilterField label="Status">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              {ARTICLE_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Created By">
          <Select value={authorFilter} onValueChange={handleAuthorChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Authors</SelectItem>
              {authors?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name || a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Sort">
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      {canBulkEdit && selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
          <p className="text-sm text-foreground">{selected.size} selected</p>
          <Select value={bulkTarget} onValueChange={(v) => setBulkTarget(v as (typeof ARTICLE_STATUS_VALUES)[number])}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'PUBLISHED' ? 'Publish' : s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={applyBulkStatus} disabled={applying}>
            {applying ? 'Applying…' : 'Apply'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} disabled={applying}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="mt-6 divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && articles.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No articles match these filters.</p>
        )}
        {canBulkEdit && articles.length > 0 && (
          <div className="flex items-center gap-3 bg-muted/30 p-4">
            <Checkbox checked={selected.size === articles.length} onCheckedChange={toggleAll} aria-label="Select all" />
            <span className="text-sm text-muted-foreground">Select all on this page</span>
          </div>
        )}
        {articles.map((article) => (
          <div key={article.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
            {canBulkEdit && (
              <Checkbox checked={selected.has(article.id)} onCheckedChange={() => toggleOne(article.id)} aria-label="Select article" />
            )}
            <Link href={`/admin/blog/${article.id}/edit`} className="flex min-w-0 flex-1 items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{article.title}</p>
                <p className="truncate text-xs text-muted-foreground">/{article.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge className={STATUS_COLORS[article.status]}>{article.status.replace('_', ' ')}</Badge>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {meta && (
        <PaginationBar
          className="mt-4"
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={pageSize}
          itemLabel="article"
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
