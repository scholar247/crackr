'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crosshair, Network, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  type GraphItem,
} from './graph-shared';

type Status = 'ACTIVE' | 'ARCHIVED';

interface CurriculumGraph {
  exams: { id: string; name: string; slug: string; status: Status; programName: string }[];
  nodes: { id: string; nodeType: string; name: string; slug: string; status: Status }[];
  edges: { parentId: string; childId: string }[];
  examNodes: { examId: string; nodeId: string }[];
}

interface GraphIndex {
  nodeById: Map<string, CurriculumGraph['nodes'][number]>;
  examById: Map<string, CurriculumGraph['exams'][number]>;
  parentsOf: Map<string, string[]>;
  childrenOf: Map<string, string[]>;
  examsOf: Map<string, string[]>;
}

interface Placed {
  key: string;
  kind: 'node' | 'exam';
  item: GraphItem;
  archived: boolean;
  col: number;
  x: number;
  y: number;
  hiddenChildren: number;
}

// Cap on how far up we walk — the hierarchy is 4 levels, so this only matters if the edge data has a cycle.
const MAX_UP = 32;

function push(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function buildIndex(graph: CurriculumGraph): GraphIndex {
  const index: GraphIndex = {
    nodeById: new Map(graph.nodes.map((n) => [n.id, n])),
    examById: new Map(graph.exams.map((e) => [e.id, e])),
    parentsOf: new Map(),
    childrenOf: new Map(),
    examsOf: new Map(),
  };
  for (const e of graph.edges) {
    push(index.parentsOf, e.childId, e.parentId);
    push(index.childrenOf, e.parentId, e.childId);
  }
  for (const m of graph.examNodes) push(index.examsOf, m.nodeId, m.examId);
  return index;
}

/** Longest distance from `id` to each ancestor (0 for `id` itself), so edges always point rightwards. */
function ancestorDistances(index: GraphIndex, id: string) {
  const dist = new Map<string, number>([[id, 0]]);
  const stack = [id];
  while (stack.length) {
    const child = stack.pop()!;
    const next = dist.get(child)! + 1;
    if (next > MAX_UP) continue;
    for (const parent of index.parentsOf.get(child) ?? []) {
      if ((dist.get(parent) ?? -1) < next) {
        dist.set(parent, next);
        stack.push(parent);
      }
    }
  }
  return dist;
}

/**
 * Every exam whose syllabus reaches `id` — mapped either to the node itself or to one of
 * its ancestors (same reachability rule as getSyllabusTree) — with the mapped node(s) it comes through.
 */
function examsReaching(index: GraphIndex, id: string) {
  const via = new Map<string, string[]>();
  for (const nodeId of ancestorDistances(index, id).keys()) {
    for (const examId of index.examsOf.get(nodeId) ?? []) push(via, examId, nodeId);
  }
  return [...via.entries()]
    .map(([examId, nodeIds]) => ({ exam: index.examById.get(examId), nodeIds, direct: nodeIds.includes(id) }))
    .filter((r): r is typeof r & { exam: NonNullable<typeof r.exam> } => !!r.exam)
    .sort((a, b) => a.exam.name.localeCompare(b.exam.name));
}

// Layered DAG around the focus: ancestors fan out to the left (one column per level, deduped,
// so a node with two parents shows both), exams sit left of the nodes they're mapped to, and
// descendants fan out to the right up to `downDepth` levels.
function buildLineage(index: GraphIndex, focusId: string, downDepth: number) {
  const up = ancestorDistances(index, focusId);

  const down = new Map<string, number>();
  let frontier = [focusId];
  for (let level = 1; level <= downDepth && frontier.length; level++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const child of index.childrenOf.get(id) ?? []) {
        if (up.has(child) || down.has(child)) continue;
        down.set(child, level);
        next.push(child);
      }
    }
    frontier = next;
  }

  const placed = new Map<string, Placed>();
  const addNode = (id: string, col: number) => {
    const n = index.nodeById.get(id);
    if (n) placed.set(id, { key: id, kind: 'node', item: n, archived: n.status === 'ARCHIVED', col, x: 0, y: 0, hiddenChildren: 0 });
  };
  for (const [id, d] of up) addNode(id, -d);
  for (const [id, d] of down) addNode(id, d);
  // Only the focus and its descendants are expected to show children; flag the ones cut off by `downDepth`.
  for (const p of placed.values()) {
    if (p.col >= 0) p.hiddenChildren = (index.childrenOf.get(p.key) ?? []).filter((c) => !placed.has(c)).length;
  }

  const edges: { from: string; to: string }[] = [];
  for (const child of placed.values()) {
    for (const parentId of index.parentsOf.get(child.key) ?? []) {
      const parent = placed.get(parentId);
      if (parent && parent.col < child.col) edges.push({ from: parent.key, to: child.key });
    }
  }

  for (const [nodeId, d] of up) {
    for (const examId of index.examsOf.get(nodeId) ?? []) {
      const exam = index.examById.get(examId);
      if (!exam) continue;
      const key = `exam:${examId}`;
      const existing = placed.get(key);
      if (!existing || existing.col > -(d + 1)) {
        placed.set(key, {
          key,
          kind: 'exam',
          item: { id: exam.id, nodeType: 'EXAM', name: exam.name, slug: exam.slug },
          archived: exam.status === 'ARCHIVED',
          col: -(d + 1),
          x: 0,
          y: 0,
          hiddenChildren: 0,
        });
      }
      edges.push({ from: key, to: nodeId });
    }
  }

  // Order each column by the average position of its already-placed neighbours (barycenter),
  // working outwards from the focus — keeps parents beside the children they connect to.
  const columns = new Map<number, Placed[]>();
  for (const p of placed.values()) {
    const list = columns.get(p.col);
    if (list) list.push(p);
    else columns.set(p.col, [p]);
  }
  const neighbours = new Map<string, string[]>();
  for (const e of edges) {
    push(neighbours, e.from, e.to);
    push(neighbours, e.to, e.from);
  }
  const rank = new Map<string, number>([[focusId, 0]]);
  const cols = [...columns.keys()];
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const order = [...Array.from({ length: -minCol }, (_, i) => -(i + 1)), ...Array.from({ length: maxCol }, (_, i) => i + 1)];
  for (const col of order) {
    const list = columns.get(col);
    if (!list) continue;
    const score = (p: Placed) => {
      const ranks = (neighbours.get(p.key) ?? []).map((n) => rank.get(n)).filter((r): r is number => r !== undefined);
      return ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0;
    };
    list.sort(
      (a, b) =>
        score(a) - score(b) ||
        (a.kind === b.kind ? 0 : a.kind === 'exam' ? 1 : -1) ||
        typeRank(a.item.nodeType) - typeRank(b.item.nodeType) ||
        a.item.name.localeCompare(b.item.name),
    );
    list.forEach((p, i) => rank.set(p.key, i - (list.length - 1) / 2));
  }

  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of placed.values()) {
    p.x = (p.col - minCol) * (NODE_W + COL_GAP);
    p.y = rank.get(p.key)! * (NODE_H + ROW_GAP);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  for (const p of placed.values()) p.y -= minY;

  return {
    nodes: [...placed.values()],
    edges: edges.map((e) => ({ ...e, key: `${e.from}->${e.to}` })),
    byKey: placed,
    width: (maxCol - minCol) * (NODE_W + COL_GAP) + NODE_W,
    height: maxY - minY + NODE_H,
    ancestorCount: up.size - 1,
    descendantCount: down.size,
  };
}

export function NodeLineageView({
  nodeId,
  canGoBack,
  onNavigate,
  onBack,
  onOpenExam,
}: {
  nodeId: string | null;
  canGoBack: boolean;
  onNavigate: (nodeId: string) => void;
  onBack: () => void;
  onOpenExam: (examId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sharedOnly, setSharedOnly] = useState(false);
  const [downDepth, setDownDepth] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [stateNodeId, setStateNodeId] = useState(nodeId);
  if (stateNodeId !== nodeId) {
    setStateNodeId(nodeId);
    setSelectedKey(null);
  }

  const { data: graph, isLoading } = useQuery({
    queryKey: ['admin-curriculum-graph'],
    queryFn: () => fetchJson<CurriculumGraph>('/api/v1/admin/curriculum/graph'),
  });
  const index = useMemo(() => (graph ? buildIndex(graph) : null), [graph]);

  const focusNode = nodeId ? index?.nodeById.get(nodeId) : undefined;
  const lineage = useMemo(() => (index && focusNode ? buildLineage(index, focusNode.id, downDepth) : null), [index, focusNode, downDepth]);
  const selected = (selectedKey && lineage?.byKey.get(selectedKey)) || (focusNode && lineage?.byKey.get(focusNode.id)) || null;
  const selectedExams = useMemo(
    () => (index && selected?.kind === 'node' ? examsReaching(index, selected.item.id) : []),
    [index, selected],
  );
  const focusExams = useMemo(() => (index && focusNode ? examsReaching(index, focusNode.id) : []), [index, focusNode]);
  const highlighted = new Set(
    lineage?.edges.filter((e) => selected && (e.from === selected.key || e.to === selected.key)).map((e) => e.key),
  );

  const results = useMemo(() => {
    if (!graph || !index) return [];
    const q = search.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      if (typeFilter !== 'ALL' && n.nodeType !== typeFilter) return false;
      if (sharedOnly && (index.parentsOf.get(n.id)?.length ?? 0) < 2 && (index.examsOf.get(n.id)?.length ?? 0) < 2) return false;
      return !q || [n.name, n.slug, n.id].some((v) => v.toLowerCase().includes(q));
    });
  }, [graph, index, search, typeFilter, sharedOnly]);
  const RESULT_LIMIT = 200;

  let overlay: string | undefined;
  if (isLoading) overlay = 'Loading curriculum…';
  else if (!focusNode) overlay = 'Pick a node to see every parent and exam it belongs to.';

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Node finder */}
      <aside className="flex max-h-[calc(100vh-220px)] min-h-[320px] flex-col rounded-lg border border-border bg-card">
        <div className="space-y-2 border-b border-border p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, slug or ID" className="pl-8" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All node types</SelectItem>
              {TYPE_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="shared-only" className="text-xs text-muted-foreground">
              Only shared nodes (2+ parents or exams)
            </Label>
            <Switch id="shared-only" checked={sharedOnly} onCheckedChange={setSharedOnly} />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-1.5">
          {isLoading && <li className="p-3 text-sm text-muted-foreground">Loading nodes…</li>}
          {!isLoading && results.length === 0 && <li className="p-3 text-sm text-muted-foreground">No nodes found.</li>}
          {index &&
            results.slice(0, RESULT_LIMIT).map((n) => {
              const parents = index.parentsOf.get(n.id)?.length ?? 0;
              const examCount = index.examsOf.get(n.id)?.length ?? 0;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(n.id)}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted',
                      n.id === nodeId && 'bg-primary/10 hover:bg-primary/10',
                    )}
                  >
                    <div className="truncate text-sm font-medium text-foreground">{n.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn('font-mono text-[10px] uppercase', TYPE_STYLE[n.nodeType]?.text)}>{n.nodeType}</span>
                      <span className="truncate">{n.slug}</span>
                    </div>
                    {(parents > 1 || examCount > 0) && (
                      <div className="mt-1 flex gap-1">
                        {parents > 1 && <Chip>{parents} parents</Chip>}
                        {examCount > 0 && <Chip>{examCount} exam{examCount > 1 ? 's' : ''}</Chip>}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          {results.length > RESULT_LIMIT && (
            <li className="p-3 text-xs text-muted-foreground">
              Showing {RESULT_LIMIT} of {results.length} — refine the search.
            </li>
          )}
        </ul>
      </aside>

      {/* Graph */}
      <section className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <Button variant="outline" size="sm" onClick={onBack} disabled={!canGoBack} title="Back to the previous node">
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="min-w-0 flex-1 text-sm">
            {focusNode ? (
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{focusNode.name}</span> · {lineage?.ancestorCount ?? 0} ancestor
                {lineage?.ancestorCount === 1 ? '' : 's'} · in {focusExams.length} exam{focusExams.length === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-muted-foreground">No node selected</span>
            )}
          </div>
          <Select value={String(downDepth)} onValueChange={(v) => setDownDepth(Number(v))}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Parents only</SelectItem>
              {[1, 2, 3].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  + {d} level{d > 1 ? 's' : ''} down
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_280px]">
          <GraphCanvas
            width={lineage?.width ?? 0}
            height={lineage?.height ?? 0}
            fitKey={`${focusNode?.id}|${downDepth}|${lineage?.nodes.length ?? 0}`}
            overlay={overlay}
          >
            {lineage && (
              <>
                <svg className="absolute inset-0 overflow-visible" width={lineage.width} height={lineage.height} aria-hidden>
                  {lineage.edges.map((e) => {
                    const from = lineage.byKey.get(e.from)!;
                    const to = lineage.byKey.get(e.to)!;
                    return <EdgePath key={e.key} x1={from.x} y1={from.y} x2={to.x} y2={to.y} highlighted={highlighted.has(e.key)} />;
                  })}
                </svg>

                {lineage.nodes.map((p) => {
                  const isFocus = p.key === focusNode?.id;
                  const parents = p.kind === 'node' ? (index?.parentsOf.get(p.key)?.length ?? 0) : 0;
                  return (
                    <NodeCard
                      key={p.key}
                      item={p.item}
                      x={p.x}
                      y={p.y}
                      isFocus={isFocus}
                      isSelected={p.key === selected?.key}
                      dimmed={p.archived}
                      chips={
                        <>
                          {parents > 1 && <Chip title="This node has several parents">{parents} parents</Chip>}
                          {p.hiddenChildren > 0 && <Chip title="Children not shown at this depth">+{p.hiddenChildren}</Chip>}
                        </>
                      }
                      actionIcon={!isFocus ? p.kind === 'exam' ? <Network className="size-3.5" /> : <Crosshair className="size-3.5" /> : undefined}
                      actionTitle={p.kind === 'exam' ? 'Open this exam’s syllabus tree' : 'Show this node’s parents'}
                      onSelect={() => setSelectedKey(p.key)}
                      onActivate={() => (p.kind === 'exam' ? onOpenExam(p.item.id) : onNavigate(p.item.id))}
                    />
                  );
                })}
              </>
            )}
          </GraphCanvas>

          {selected && index ? (
            <aside className="space-y-4 overflow-y-auto border-t border-border p-4 xl:max-h-[calc(100vh-280px)] xl:border-t-0 xl:border-l">
              <ItemSummary item={selected.item} />

              {selected.kind === 'exam' ? (
                <Button size="sm" className="w-full" onClick={() => onOpenExam(selected.item.id)}>
                  <Network className="size-4" /> Open syllabus tree
                </Button>
              ) : (
                <>
                  <RelatedList
                    title="Parents"
                    empty="No parents (root node)"
                    items={(index.parentsOf.get(selected.item.id) ?? []).flatMap((id) => index.nodeById.get(id) ?? [])}
                    onPick={(id) => onNavigate(id)}
                  />
                  <div>
                    <div className="text-xs text-muted-foreground">Exams ({selectedExams.length})</div>
                    {selectedExams.length === 0 ? (
                      <div className="mt-0.5 text-sm text-muted-foreground">Not part of any exam</div>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {selectedExams.map(({ exam, nodeIds, direct }) => (
                          <li key={exam.id}>
                            <button
                              type="button"
                              onClick={() => onOpenExam(exam.id)}
                              className="w-full rounded px-1.5 py-1 text-left hover:bg-muted"
                              title="Open this exam’s syllabus tree"
                            >
                              <div className="truncate text-sm text-foreground">{exam.name}</div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {direct
                                  ? 'Mapped directly'
                                  : `via ${nodeIds.map((id) => index.nodeById.get(id)?.name ?? id).join(', ')}`}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Direct children</div>
                    <div className="mt-0.5 text-sm text-foreground">{index.childrenOf.get(selected.item.id)?.length ?? 0}</div>
                  </div>
                  {selected.key !== focusNode?.id && (
                    <Button size="sm" className="w-full" onClick={() => onNavigate(selected.item.id)}>
                      <Crosshair className="size-4" /> Show this node’s parents
                    </Button>
                  )}
                </>
              )}
            </aside>
          ) : (
            <aside className="hidden border-l border-border p-4 text-sm text-muted-foreground xl:block">Select a node to see its details.</aside>
          )}
        </div>
      </section>
    </div>
  );
}

function RelatedList({
  title,
  empty,
  items,
  onPick,
}: {
  title: string;
  empty: string;
  items: GraphItem[];
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div className="mt-0.5 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => onPick(n.id)} className="w-full rounded px-1.5 py-1 text-left hover:bg-muted">
                <span className={cn('mr-1.5 font-mono text-[10px] uppercase', TYPE_STYLE[n.nodeType]?.text)}>{n.nodeType}</span>
                <span className="text-sm text-foreground">{n.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
