'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  examsForPath,
  indexNodes,
  pathMatchingTags,
  pathNames,
  rootPaths,
  type GraphNode,
} from '@/lib/curriculum-paths';

const MAX_NODES = 12;
const MAX_PATHS_PER_NODE = 6;

export function useCurriculumGraph() {
  const { data: nodes = [], isLoading } = useQuery<GraphNode[]>({
    queryKey: ['public-nodes-graph'],
    queryFn: () => fetch('/api/v1/public/nodes?withGraph=1').then((r) => r.json()).then((j) => j.data),
    staleTime: 5 * 60 * 1000,
  });
  const index = useMemo(() => indexNodes(nodes), [nodes]);
  return { nodes, index, isLoading };
}

interface NodePathPickerProps {
  /**
   * The chosen chain, root → leaf. `null` = nothing chosen / cleared; `undefined` = the user
   * hasn't touched it, so show the saved tags (`initial`) instead.
   */
  value: string[] | null | undefined;
  onChange: (path: string[] | null) => void;
  /** What the item is already tagged with (leaf + the nodes above it), when editing. */
  initial?: { leafId: string | null; nodeIds: string[] };
}

// Picking a *chain*, not a bare node: "Trigonometry" under both "Mathematics" and
// "Mathematics (Class 10)" shows up as two rows, each with the exams it belongs to, and the
// article is attached to exactly the nodes on the chain you click — never the other branch.
export function NodePathPicker({ value, onChange, initial }: NodePathPickerProps) {
  const { nodes, index, isLoading } = useCurriculumGraph();
  const [search, setSearch] = useState('');

  const savedPath = useMemo(
    () => (initial?.leafId ? pathMatchingTags(initial.leafId, initial.nodeIds, index) : null),
    [initial, index]
  );
  const hasSavedTags = !!initial && initial.nodeIds.length > 0;
  const showingSaved = value === undefined;
  const display = showingSaved ? savedPath : value;
  // Saved tags that don't form a single chain: attached through several parent branches.
  const legacyOverAttached = showingSaved && hasSavedTags && !savedPath && nodes.length > 0;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter((n) => n.name.toLowerCase().includes(q))
      .slice(0, MAX_NODES)
      .flatMap((n) => rootPaths(n.id, index, MAX_PATHS_PER_NODE).map((path) => ({ node: n, path })));
  }, [nodes, index, search]);

  return (
    <div className="space-y-2">
      {legacyOverAttached && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Attached to more than one branch</p>
            <p className="mt-0.5 text-muted-foreground">
              Currently tagged: {initial!.nodeIds.map((id) => index.get(id)?.name ?? '…').join(', ')}. Pick the exact chain below to fix it.
            </p>
          </div>
        </div>
      )}

      {display && display.length > 0 ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {pathNames(display, index).map((name, i) => (
                <span key={`${name}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Badge variant={i === display.length - 1 ? 'default' : 'secondary'}>{name}</Badge>
                </span>
              ))}
            </div>
            <button type="button" onClick={() => onChange(null)} aria-label="Remove curriculum tag">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Attached to exactly these {display.length} node{display.length === 1 ? '' : 's'}
            {examsForPath(display, index).length > 0 ? ` · exams: ${examsForPath(display, index).join(', ')}` : ''}.
          </p>
        </div>
      ) : (
        <div className="relative">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subjects, chapters, topics…" disabled={isLoading} />
          {search.trim() !== '' && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {rows.length === 0 && <p className="p-3 text-xs text-muted-foreground">No matching nodes.</p>}
              {rows.map(({ node, path }) => {
                const exams = examsForPath(path, index);
                return (
                  <button
                    key={path.join('>')}
                    type="button"
                    onClick={() => {
                      onChange(path);
                      setSearch('');
                    }}
                    className="flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-muted"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-foreground">
                        {pathNames(path, index).map((name, i, all) => (
                          <span key={`${name}-${i}`} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                            <span className={i === all.length - 1 ? 'font-medium' : 'text-muted-foreground'}>{name}</span>
                          </span>
                        ))}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{node.nodeType}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{exams.length > 0 ? `Exams: ${exams.join(', ')}` : 'Not linked to an exam'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
