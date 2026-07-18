'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ContentSeedClient, SeedStatus, SeedKind } from '@/types';

const STATUS_VARIANTS: Record<SeedStatus, 'secondary' | 'outline' | 'success' | 'destructive'> = {
  PENDING: 'secondary',
  GENERATING: 'outline',
  DONE: 'success',
  FAILED: 'destructive',
};

const JOBS = [
  { key: 'blog-seeder', label: 'Blog Seeder' },
  { key: 'blog-generator', label: 'Blog Generator' },
  { key: 'mcq-seeder', label: 'MCQ Seeder' },
  { key: 'mcq-generator', label: 'MCQ Generator' },
] as const;

async function fetchSeeds(params: URLSearchParams) {
  const res = await fetch(`/api/admin/ai-factory/seeds?${params}`);
  return res.json();
}

export function SeedMonitorClient() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<SeedStatus | ''>('');
  const [kind, setKind] = useState<SeedKind | ''>('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: '20',
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ai-factory-seeds', params.toString()],
    queryFn: () => fetchSeeds(params),
  });

  const seeds: ContentSeedClient[] = data?.data ?? [];
  const meta = data?.meta ?? {};

  const retryMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/ai-factory/seeds/${id}/retry`, { method: 'PATCH' }).then((r) => {
        if (!r.ok) throw new Error('Retry failed');
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-factory-seeds'] });
      toast.success('Seed re-queued');
    },
    onError: () => toast.error('Retry failed'),
  });

  const runJobMutation = useMutation({
    mutationFn: (jobKey: string) =>
      fetch(`/api/cron/ai/${jobKey}`, { method: 'POST' }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? 'Job failed');
        return body.data as { processed: number; succeeded: number; failed: number };
      }),
    onSuccess: (result, jobKey) => {
      qc.invalidateQueries({ queryKey: ['ai-factory-seeds'] });
      toast.success(`${jobKey}: processed ${result.processed}, ${result.succeeded} succeeded, ${result.failed} failed`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {JOBS.map((job) => (
          <Button
            key={job.key}
            variant="outline"
            size="sm"
            disabled={runJobMutation.isPending}
            onClick={() => runJobMutation.mutate(job.key)}
          >
            <Play className="h-3.5 w-3.5" />
            Run {job.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={kind || 'all'}
          onValueChange={(v) => {
            setKind(v === 'all' ? '' : (v as SeedKind));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Kind" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            <SelectItem value="BLOG">Blog</SelectItem>
            <SelectItem value="MCQ">MCQ</SelectItem>
          </SelectContent>
        </Select>

        <Tabs
          value={status || 'ALL'}
          onValueChange={(v) => {
            setStatus(v === 'ALL' ? '' : (v as SeedStatus));
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="GENERATING">Generating</TabsTrigger>
            <TabsTrigger value="FAILED">Failed</TabsTrigger>
            <TabsTrigger value="DONE">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Kind
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Scope (topic id)
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Attempts
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Last error
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Updated
                </th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {seeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-12">
                    No seeds found
                  </td>
                </tr>
              ) : (
                seeds.map((seed, i) => (
                  <tr key={seed.id} className={cn('transition-colors', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {seed.kind}
                        {seed.articleType ? `/${seed.articleType}` : ''}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {seed.resolvedTopicId ?? seed.topicId}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[seed.status]} className="text-xs">
                        {seed.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {seed.attempts}/{seed.maxAttempts}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-muted-foreground max-w-64 truncate"
                      title={seed.lastError}
                    >
                      {seed.lastError ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(seed.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {seed.status === 'FAILED' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Retry"
                          onClick={() => retryMutation.mutate(seed.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
