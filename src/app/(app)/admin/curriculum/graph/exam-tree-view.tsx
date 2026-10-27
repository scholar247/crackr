'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ChevronRight, Crosshair, GitFork, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  COL_GAP,
  Chip,
  EdgePath,
  GraphCanvas,
  ItemSummary,
  NODE_H,
  NODE_W,
  NodeCard,
  ROW_GAP,
  TYPE_ORDER,
  TYPE_STYLE,
  fetchJson,
  typeRank,
} from './graph-shared';

export interface Exam {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED';
  programName: string;
}

interface SyllabusNode {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  children: SyllabusNode[];
}

interface PlacedNode {
  key: string;
  node: SyllabusNode;
  /** Ids from the focused node (exclusive) down to this node (inclusive). */
  relPath: string[];
  x: number;
  y: number;
  hiddenChildren: number;
}

interface Edge {
  key: string;
  from: PlacedNode;
  to: PlacedNode;
}

function sortChildren(children: SyllabusNode[]) {
  return [...children].sort((a, b) => typeRank(a.nodeType) - typeRank(b.nodeType) || a.name.localeCompare(b.name));
}

/** Walks `path` (child ids) down from `root`; stops at the deepest id that still resolves. */
function resolvePath(root: SyllabusNode, path: string[]): SyllabusNode[] {
  const chain = [root];
  for (const id of path) {
    const next = chain[chain.length - 1].children.find((c) => c.id === id);
    if (!next) break;
    chain.push(next);
  }
  return chain;
}

// Left-to-right tidy tree: leaves stack vertically, each parent centres on its children.
// A node can be shared under several parents, so placements are keyed by path, and
// ancestors are tracked to stay safe if the edge data ever contains a cycle.
function layoutTree(focus: SyllabusNode, depth: number) {
  const nodes: PlacedNode[] = [];
  const edges: Edge[] = [];
  let cursor = 0;

  function place(node: SyllabusNode, level: number, relPath: string[], ancestors: Set<string>): PlacedNode {
    const children = sortChildren(node.children).filter((c) => !ancestors.has(c.id));
    const expand = level < depth && children.length > 0;
    const placed: PlacedNode = {
      key: relPath.join('/') || node.id,
      node,
      relPath,
      x: level * (NODE_W + COL_GAP),
      y: 0,
      hiddenChildren: expand ? 0 : children.length,
    };

    if (expand) {
      const nextAncestors = new Set(ancestors).add(node.id);
      const placedChildren = children.map((child) => place(child, level + 1, [...relPath, child.id], nextAncestors));
      placed.y = (placedChildren[0].y + placedChildren[placedChildren.length - 1].y) / 2;
      for (const child of placedChildren) edges.push({ key: `${placed.key}->${child.key}`, from: placed, to: child });
    } else {
      placed.y = cursor;
      cursor += NODE_H + ROW_GAP;
    }

    nodes.push(placed);
    return placed;
  }

  place(focus, 0, [], new Set());

  const width = Math.max(...nodes.map((n) => n.x)) + NODE_W;
  const height = Math.max(cursor - ROW_GAP, NODE_H);
  return { nodes, edges, width, height };
}

function countDescendants(node: SyllabusNode) {
  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  const stack = [...node.children];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    counts[n.nodeType] = (counts[n.nodeType] ?? 0) + 1;
    stack.push(...n.children);
  }
  return counts;
}

export function ExamTreeView({
  examId,
  onExamChange,
  onShowLineage,
}: {
  examId: string | null;
  onExamChange: (id: string) => void;
  onShowLineage: (nodeId: string) => void;
}) {
  const [examSearch, setExamSearch] = useState('');
  const [focusPath, setFocusPath] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  // Focus/selection belong to one exam; reset them when the exam changes (including from the lineage view).
  const [stateExamId, setStateExamId] = useState(examId);
  if (stateExamId !== examId) {
    setStateExamId(examId);
    setFocusPath([]);
    setSelectedKey(null);
  }

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: () => fetchJson<Exam[]>('/api/v1/admin/curriculum/exams'),
  });
  const exam = exams?.find((e) => e.id === examId) ?? null;

  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['admin-syllabus-tree', examId],
    queryFn: () => fetchJson<SyllabusNode[]>(`/api/v1/admin/curriculum/exams/${examId}/syllabus-tree`),
    enabled: !!examId,
  });

  // The exam itself becomes the synthetic root so "go to top" always has somewhere to land.
  const root = useMemo<SyllabusNode | null>(
    () => (exam && tree ? { id: exam.id, nodeType: 'EXAM', name: exam.name, slug: exam.slug, children: tree } : null),
    [exam, tree],
  );
  const chain = useMemo(() => (root ? resolvePath(root, focusPath) : []), [root, focusPath]);
  const focus = chain[chain.length - 1] ?? null;
  const layout = useMemo(() => (focus ? layoutTree(focus, depth) : null), [focus, depth]);
  const selected = layout?.nodes.find((n) => n.key === selectedKey) ?? layout?.nodes.find((n) => n.relPath.length === 0) ?? null;
  const selectedCounts = useMemo(() => (selected ? countDescendants(selected.node) : {}), [selected]);

  const filteredExams = useMemo(() => {
    const q = examSearch.trim().toLowerCase();
    if (!exams) return [];
    if (!q) return exams;
    return exams.filter((e) => [e.name, e.slug, e.id, e.programName].some((v) => v.toLowerCase().includes(q)));
  }, [exams, examSearch]);

  function focusOn(next: string[]) {
    setFocusPath(next);
    setSelectedKey(null);
  }

  function drillInto(placed: PlacedNode) {
    if (placed.relPath.length === 0) return;
    focusOn([...focusPath.slice(0, chain.length - 1), ...placed.relPath]);
  }

  let overlay: string | undefined;
  if (!examId) overlay = 'Select an exam to see its syllabus graph.';
  else if (treeLoading) overlay = 'Loading syllabus…';

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Exam list */}
      <aside className="flex max-h-[calc(100vh-220px)] min-h-[320px] flex-col rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={examSearch} onChange={(e) => setExamSearch(e.target.value)} placeholder="Search exams" className="pl-8" />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-1.5">
          {examsLoading && <li className="p-3 text-sm text-muted-foreground">Loading exams…</li>}
          {!examsLoading && filteredExams.length === 0 && <li className="p-3 text-sm text-muted-foreground">No exams found.</li>}
          {filteredExams.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onExamChange(e.id)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted',
                  e.id === examId && 'bg-primary/10 hover:bg-primary/10',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{e.name}</span>
                  {e.status === 'ARCHIVED' && <Badge variant="neutral">Archived</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {e.programName} · {e.slug}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Graph */}
      <section className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm" aria-label="Focus path">
            {chain.length === 0 && <span className="text-muted-foreground">No exam selected</span>}
            {chain.map((n, i) => (
              <span key={`${n.id}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
                <button
                  type="button"
                  onClick={() => focusOn(focusPath.slice(0, i))}
                  disabled={i === chain.length - 1}
                  className={cn(
                    'max-w-[180px] truncate rounded px-1.5 py-0.5',
                    i === chain.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {n.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => focusOn([])} disabled={chain.length <= 1} title="Go to top (exam)">
              <Home className="size-4" /> Top
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => focusOn(focusPath.slice(0, chain.length - 2))}
              disabled={chain.length <= 1}
              title="Up one level"
            >
              <ArrowUp className="size-4" /> Up
            </Button>
            <Select value={String(depth)} onValueChange={(v) => setDepth(Number(v))}>
              <SelectTrigger className="h-8 w-[118px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} level{d > 1 ? 's' : ''} deep
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_280px]">
          <GraphCanvas
            width={layout?.width ?? 0}
            height={layout?.height ?? 0}
            fitKey={`${examId}|${focus?.id}|${focusPath.join('/')}|${depth}|${layout?.nodes.length ?? 0}`}
            overlay={overlay}
          >
            {layout && (
              <>
                <svg className="absolute inset-0 overflow-visible" width={layout.width} height={layout.height} aria-hidden>
                  {layout.edges.map(({ key, from, to }) => (
                    <EdgePath key={key} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                  ))}
                </svg>

                {layout.nodes.map((placed) => {
                  const isFocus = placed.relPath.length === 0;
                  return (
                    <NodeCard
                      key={placed.key}
                      item={placed.node}
                      x={placed.x}
                      y={placed.y}
                      isFocus={isFocus}
                      isSelected={placed.key === selected?.key}
                      chips={placed.hiddenChildren > 0 && <Chip title="Children hidden at this depth">+{placed.hiddenChildren}</Chip>}
                      actionIcon={!isFocus && placed.node.children.length > 0 ? <Crosshair className="size-3.5" /> : undefined}
                      actionTitle="Focus on this node"
                      onSelect={() => setSelectedKey(placed.key)}
                      onActivate={() => drillInto(placed)}
                    />
                  );
                })}

                {layout.nodes.length === 1 && focus?.children.length === 0 && (
                  <div className="absolute text-sm text-muted-foreground" style={{ left: NODE_W + 24, top: NODE_H / 2 - 10 }}>
                    No child nodes
                  </div>
                )}
              </>
            )}
          </GraphCanvas>

          {selected ? (
            <aside className="space-y-4 border-t border-border p-4 xl:border-t-0 xl:border-l">
              <ItemSummary item={selected.node} />

              <div>
                <div className="text-xs text-muted-foreground">Direct children</div>
                <div className="mt-0.5 text-sm text-foreground">{selected.node.children.length}</div>
              </div>

              {Object.keys(selectedCounts).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">All descendants</div>
                  <ul className="mt-1 space-y-1">
                    {TYPE_ORDER.filter((t) => selectedCounts[t]).map((t) => (
                      <li key={t} className="flex items-center justify-between text-sm">
                        <span className={cn('font-mono text-[11px] uppercase', TYPE_STYLE[t].text)}>{t}</span>
                        <span className="text-foreground">{selectedCounts[t]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                {selected.relPath.length > 0 && selected.node.children.length > 0 && (
                  <Button size="sm" className="w-full" onClick={() => drillInto(selected)}>
                    <Crosshair className="size-4" /> Focus on this node
                  </Button>
                )}
                {selected.node.nodeType !== 'EXAM' && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => onShowLineage(selected.node.id)}>
                    <GitFork className="size-4" /> Show all parents & exams
                  </Button>
                )}
              </div>
            </aside>
          ) : (
            <aside className="hidden border-l border-border p-4 text-sm text-muted-foreground xl:block">Select a node to see its details.</aside>
          )}
        </div>
      </section>
    </div>
  );
}
