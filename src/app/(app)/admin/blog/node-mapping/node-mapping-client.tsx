'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Link2, Unlink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { STATUS_COLORS } from '@/lib/utils';

interface CurriculumNode {
  id: string;
  name: string;
  nodeType: string;
  status: string;
  parents: { id: string; name: string }[];
}

interface MappableArticle {
  id: number;
  title: string;
  slug: string;
  status: string;
  nodeId: string | null;
  nodeName: string | null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load');
  return (await res.json()).data;
}

const MAX_NODE_RESULTS = 40;

export function NodeMappingClient() {
  const qc = useQueryClient();
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [unmappedOnly, setUnmappedOnly] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: nodes = [] } = useQuery<CurriculumNode[]>({
    queryKey: ['admin-curriculum-nodes'],
    queryFn: () => fetchJson('/api/v1/admin/curriculum/nodes'),
    staleTime: 5 * 60 * 1000,
  });
  const { data: articles = [], isLoading } = useQuery<MappableArticle[]>({
    queryKey: ['admin-blog-node-mapping'],
    queryFn: () => fetchJson('/api/v1/admin/blog/node-mapping'),
  });

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const activeNodes = useMemo(() => nodes.filter((n) => n.status === 'ACTIVE'), [nodes]);

  // Breadcrumb for display (first-parent chain) and the full ancestor set the server will
  // attach (every parent, matching taxonomyRepository.getAncestorIds).
  const pathOf = (id: string): string[] => {
    const names: string[] = [];
    const seen = new Set<string>();
    let cur = nodeById.get(id);
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      names.unshift(cur.name);
      cur = cur.parents[0] ? nodeById.get(cur.parents[0].id) : undefined;
    }
    return names;
  };
  const ancestorsOf = (id: string) => {
    const out = new Map<string, string>();
    const stack = [...(nodeById.get(id)?.parents ?? [])];
    while (stack.length) {
      const p = stack.pop()!;
      if (out.has(p.id)) continue;
      out.set(p.id, p.name);
      stack.push(...(nodeById.get(p.id)?.parents ?? []));
    }
    return [...out.values()];
  };

  const selectedNode = nodeId ? nodeById.get(nodeId) : undefined;
  const nodeMatches = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase();
    if (!q) return [];
    return activeNodes.filter((n) => n.name.toLowerCase().includes(q)).slice(0, MAX_NODE_RESULTS);
  }, [activeNodes, nodeSearch]);

  const visibleArticles = useMemo(() => {
    const q = articleSearch.trim().toLowerCase();
    return articles.filter((a) => (!unmappedOnly || !a.nodeId) && (!q || a.title.toLowerCase().includes(q)));
  }, [articles, articleSearch, unmappedOnly]);

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
    mutationFn: async (target: string | null) => {
      const res = await fetch('/api/v1/admin/blog/node-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], nodeId: target }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Mapping failed');
      return json.data as { updated: number };
    },
    onSuccess: ({ updated }, target) => {
      toast.success(
        target ? `${updated} blog${updated === 1 ? '' : 's'} mapped` : `Mapping cleared for ${updated} blog${updated === 1 ? '' : 's'}`,
      );
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['admin-blog-node-mapping'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedArticles = articles.filter((a) => selected.has(a.id));
  const remappedCount = selectedArticles.filter((a) => a.nodeId && a.nodeId !== nodeId).length;

  const handleMap = () => {
    if (!nodeId) return;
    if (
      remappedCount > 0 &&
      !confirm(
        `${remappedCount} of the selected blog${remappedCount === 1 ? ' is' : 's are'} already mapped to another node. Re-map ${remappedCount === 1 ? 'it' : 'them'} to “${selectedNode?.name}”?`,
      )
    )
      return;
    apply.mutate(nodeId);
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
        Pick a subject, chapter or topic, select any number of blogs, and map them. Each blog is attached to that node and every parent
        above it, up to the root.
        {articles.length > 0 && ` ${unmappedTotal} of ${articles.length} blogs are not mapped yet.`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* 1. Node */}
        <div className="space-y-3 self-start rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-medium">1. Choose a node</Label>
          {selectedNode ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{selectedNode.name}</p>
                  <p className="text-xs text-muted-foreground">{pathOf(selectedNode.id).join(' › ')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant="secondary">{selectedNode.nodeType}</Badge>
                  <button type="button" onClick={() => setNodeId(null)} aria-label="Change node">
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {ancestorsOf(selectedNode.id).length > 0
                  ? `Also attaches to: ${ancestorsOf(selectedNode.id).join(', ')}`
                  : 'Top-level node — no parents above it.'}
              </p>
            </div>
          ) : (
            <>
              <Input value={nodeSearch} onChange={(e) => setNodeSearch(e.target.value)} placeholder="Search subjects, chapters, topics…" />
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                {nodeSearch.trim() === '' && <p className="p-3 text-xs text-muted-foreground">Type to search the curriculum.</p>}
                {nodeSearch.trim() !== '' && nodeMatches.length === 0 && (
                  <p className="p-3 text-xs text-muted-foreground">No matching nodes.</p>
                )}
                {nodeMatches.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setNodeId(n.id);
                      setNodeSearch('');
                    }}
                    className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{n.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {pathOf(n.id).slice(0, -1).join(' › ') || 'Top level'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{n.nodeType}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 2. Blogs */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium">2. Select blogs</Label>
            <Input
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              placeholder="Search blog titles…"
              className="max-w-xs"
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={unmappedOnly} onCheckedChange={(v) => setUnmappedOnly(v === true)} />
              Unmapped only
            </label>
          </div>

          <div className="mt-3 divide-y divide-border rounded-lg border border-border">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && visibleArticles.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No blogs match these filters.</p>
            )}
            {visibleArticles.length > 0 && (
              <div className="flex items-center gap-3 bg-muted/30 p-3">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label="Select all shown" />
                <span className="text-sm text-muted-foreground">Select all {visibleArticles.length} shown</span>
              </div>
            )}
            <div className="max-h-[560px] overflow-y-auto">
              {visibleArticles.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-border p-3 last:border-0 hover:bg-muted/50"
                >
                  <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleOne(a.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{a.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.nodeName ? `Mapped to ${a.nodeName}` : 'Not mapped'}
                    </span>
                  </span>
                  <Badge className={STATUS_COLORS[a.status]}>{a.status.replace('_', ' ')}</Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="sticky bottom-2 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-md backdrop-blur">
            <p className="text-sm text-foreground">
              {selected.size} selected{selectedNode ? ` → ${selectedNode.name}` : ''}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} disabled={selected.size === 0 || apply.isPending}>
                Clear selection
              </Button>
              <Button size="sm" variant="outline" onClick={handleClear} disabled={selected.size === 0 || apply.isPending}>
                <Unlink className="mr-1.5 h-4 w-4" /> Remove mapping
              </Button>
              <Button size="sm" onClick={handleMap} disabled={!nodeId || selected.size === 0 || apply.isPending}>
                <Link2 className="mr-1.5 h-4 w-4" /> {apply.isPending ? 'Mapping…' : `Map ${selected.size || ''} to node`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
