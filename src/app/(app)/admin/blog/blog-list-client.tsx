'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/lib/utils';

interface ArticleRow {
  id: string;
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

export function BlogListClient() {
  const { data: articles, isLoading } = useQuery({ queryKey: ['admin-blog'], queryFn: fetchArticles });

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

      <div className="mt-6 divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && articles?.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No articles yet — create your first one.</p>
        )}
        {articles?.map((article) => (
          <Link
            key={article.id}
            href={`/admin/blog/${article.id}/edit`}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{article.title}</p>
              <p className="truncate text-xs text-muted-foreground">/{article.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={STATUS_COLORS[article.status]}>{article.status.replace('_', ' ')}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
