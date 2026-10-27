'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NodePathPicker, useCurriculumGraph } from '@/components/curriculum/node-path-picker';
import { pathMatchingTags, pathNames } from '@/lib/curriculum-paths';
import { STATUS_COLORS } from '@/lib/utils';

interface MappableArticle {
  id: number;
  title: string;
  slug: string;
  status: string;
  nodeId: string | null;
  nodeName: string | null;
  /** Every node the article is tagged with (leaf + the nodes above it). */
  nodeIds: string[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load');
  return (await res.json()).data;
}

export function NodeMappingClient() {
  const qc = useQueryClient();
  const { index } = useCurriculumGraph();
  const [nodePath, setNodePath] = useState<string[] | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [unmappedOnly, setUnmappedOnly] = useState(true);
  const [needsFixingOnly, setNeedsFixingOnly] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: articles = [], isLoading } = useQuery<MappableArticle[]>({
    queryKey: ['admin-blog-node-mapping'],
    queryFn: () => fetchJson('/api/v1/admin/blog/node-mapping'),
  });

  const leafId = nodePath ? nodePath[nodePath.length - 1] : null;

  // The tags stored for a blog form one chain when mapping worked as intended. When they
  // don't (older mappings walked every parent), the blog is attached to extra branches.
  const chainOf = (a: MappableArticle) => (a.nodeId ? pathMatchingTags(a.nodeId, a.nodeIds, index) : null);
  const isOverAttached = (a: MappableArticle) => index.size > 0 && !!a.nodeId && !chainOf(a);

  const visibleArticles = useMemo(() => {
    const q = articleSearch.trim().toLowerCase();
    return articles.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q)) return false;
      if (needsFixingOnly) return index.size > 0 && !!a.nodeId && !pathMatchingTags(a.nodeId, a.nodeIds, index);
      return !unmappedOnly || !a.nodeId;
    });
  }, [articles, articleSearch, unmappedOnly, needsFixingOnly, index]);

  const needsFixingTotal = useMemo(
    () => articles.filter((a) => index.size > 0 && a.nodeId && !pathMatchingTags(a.nodeId, a.nodeIds, index)).length,
    [articles, index]
  );

  const allVisibleSelected = visibleArticles.length > 0 && visibleArticles.every((a) => selected.has(a.id));
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleArticles.forEach((a) => next.delete(a.id));
      else visibleArticles.forEach((a) => next.add(a.id));
      return next;
    });

  const apply = useMutation({
    mutationFn: async (target: string[] | null) => {
      const res = await fetch('/api/v1/admin/blog/node-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], nodePath: target }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Mapping failed');
      return json.data as { updated: number };
    },
    onSuccess: ({ updated }, target) => {
      toast.success(target ? `${updated} blog${updated === 1 ? '' : 's'} mapped` : `Mapping cleared for ${updated} blog${updated === 1 ? '' : 's'}`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['admin-blog-node-mapping'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedArticles = articles.filter((a) => selected.has(a.id));
  const remappedCount = selectedArticles.filter((a) => a.nodeId && a.nodeId !== leafId).length;
  const leafName = leafId ? index.get(leafId)?.name : undefined;

  const handleMap = () => {
    if (!nodePath) return;
    if (
      remappedCount > 0 &&
      !confirm(`${remappedCount} of the selected blog${remappedCount === 1 ? ' is' : 's are'} already mapped to another node. Re-map ${remappedCount === 1 ? 'it' : 'them'} to “${leafName}”?`)
    )
      return;
    apply.mutate(nodePath);
  };
  const handleClear = () => {
    if (!confirm(`Remove the curriculum mapping from ${selected.size} selected blog${selected.size === 1 ? '' : 's'}?`)) return;
    apply.mutate(null);
  };

  const unmappedTotal = articles.filter((a) => !a.nodeId).length;

  return (
    <div>
      <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Map blogs to curriculum</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Pick one exact chain — a subject, chapter or topic together with the parents above it — then select any number of blogs. Each blog is attached to
        the nodes on that chain only, never to other branches the same topic also belongs to.
        {articles.length > 0 && ` ${unmappedTotal} of ${articles.length} blogs are not mapped yet.`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* 1. Chain */}
        <div className="space-y-3 self-start rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-medium">1. Choose the exact chain</Label>
          <NodePathPicker value={nodePath} onChange={setNodePath} />
        </div>

        {/* 2. Blogs */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium">2. Select blogs</Label>
            <Input value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} placeholder="Search blog titles…" className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={unmappedOnly} disabled={needsFixingOnly} onCheckedChange={(v) => setUnmappedOnly(v === true)} />
              Unmapped only
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={needsFixingOnly} onCheckedChange={(v) => setNeedsFixingOnly(v === true)} />
              Needs fixing{needsFixingTotal > 0 ? ` (${needsFixingTotal})` : ''}
            </label>
          </div>

          <div className="mt-3 divide-y divide-border rounded-lg border border-border">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && visibleArticles.length === 0 && <p className="p-4 text-sm text-muted-foreground">No blogs match these filters.</p>}
            {visibleArticles.length > 0 && (
              <div className="flex items-center gap-3 bg-muted/30 p-3">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label="Select all shown" />
                <span className="text-sm text-muted-foreground">Select all {visibleArticles.length} shown</span>
              </div>
            )}
            <div className="max-h-[560px] overflow-y-auto">
              {visibleArticles.map((a) => {
                const chain = chainOf(a);
                const over = isOverAttached(a);
                return (
                  <label key={a.id} className="flex cursor-pointer items-center gap-3 border-b border-border p-3 last:border-0 hover:bg-muted/50">
                    <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleOne(a.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{a.title}</span>
                      {over ? (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-500">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Attached to extra branches ({a.nodeIds.length} nodes) — re-map to fix
                        </span>
                      ) : (
                        <span className="block truncate text-xs text-muted-foreground">
                          {chain ? `Mapped to ${pathNames(chain, index).join(' › ')}` : a.nodeName ? `Mapped to ${a.nodeName}` : 'Not mapped'}
                        </span>
                      )}
                    </span>
                    <Badge className={STATUS_COLORS[a.status]}>{a.status.replace('_', ' ')}</Badge>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action bar */}
          <div className="sticky bottom-2 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-md backdrop-blur">
            <p className="text-sm text-foreground">
              {selected.size} selected{leafName ? ` → ${leafName}` : ''}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} disabled={selected.size === 0 || apply.isPending}>
                Clear selection
              </Button>
              <Button size="sm" variant="outline" onClick={handleClear} disabled={selected.size === 0 || apply.isPending}>
                <Unlink className="mr-1.5 h-4 w-4" /> Remove mapping
              </Button>
              <Button size="sm" onClick={handleMap} disabled={!nodePath || selected.size === 0 || apply.isPending}>
                <Link2 className="mr-1.5 h-4 w-4" /> {apply.isPending ? 'Mapping…' : `Map ${selected.size || ''} to chain`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
