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
import { STATUS_COLORS } from '@/lib/utils';
import { ARTICLE_STATUS_VALUES } from '@/schemas/article.schema';
import { isAdmin, type UserRole } from '@/lib/roles';

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  updatedAt: string;
}

async function fetchArticles(): Promise<ArticleRow[]> {
  const res = await fetch('/api/v1/admin/blog');
  if (!res.ok) throw new Error('Failed to load articles');
  return (await res.json()).data;
}

export function BlogListClient({ role }: { role: UserRole }) {
  const canBulkEdit = isAdmin(role);
  const { data: articles, isLoading, refetch } = useQuery({ queryKey: ['admin-blog'], queryFn: fetchArticles });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<(typeof ARTICLE_STATUS_VALUES)[number]>('PUBLISHED');
  const [applying, setApplying] = useState(false);

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === articles?.length ? new Set() : new Set(articles?.map((a) => a.id) ?? [])));
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
        {!isLoading && articles?.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No articles yet — create your first one.</p>
        )}
        {canBulkEdit && articles && articles.length > 0 && (
          <div className="flex items-center gap-3 bg-muted/30 p-4">
            <Checkbox checked={selected.size === articles.length} onCheckedChange={toggleAll} aria-label="Select all" />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>
        )}
        {articles?.map((article) => (
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
    </div>
  );
}
