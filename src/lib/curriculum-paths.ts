// Client-side helpers over the curriculum graph from /api/v1/public/nodes?withGraph=1.
// A node can sit under several parents, so "the path to the root" is plural — these helpers
// enumerate each distinct root → node chain so an author can pick exactly one.

export interface GraphNode {
  id: string;
  name: string;
  nodeType: string;
  slug: string;
  parentIds: string[];
  /** Exams this node is directly mapped to (usually only top-level nodes are). */
  exams: string[];
}

export type NodeIndex = Map<string, GraphNode>;

export function indexNodes(nodes: GraphNode[]): NodeIndex {
  return new Map(nodes.map((n) => [n.id, n]));
}

/** Every chain from a root down to `id`, each ordered root → id. */
export function rootPaths(id: string, index: NodeIndex, max = 20): string[][] {
  const paths: string[][] = [];
  const walk = (cur: string, suffix: string[]) => {
    if (paths.length >= max || suffix.includes(cur)) return;
    const node = index.get(cur);
    if (!node) return;
    if (node.parentIds.length === 0) {
      paths.push([cur, ...suffix]);
      return;
    }
    for (const parent of node.parentIds) walk(parent, [cur, ...suffix]);
  };
  walk(id, []);
  return paths;
}

export function pathNames(path: string[], index: NodeIndex): string[] {
  return path.map((id) => index.get(id)?.name ?? '…');
}

/** Exam names reachable through this chain — what tells two same-named chains apart. */
export function examsForPath(path: string[], index: NodeIndex): string[] {
  const out = new Set<string>();
  for (const id of path) index.get(id)?.exams.forEach((e) => out.add(e));
  return [...out].sort();
}

/** The chain (ending at `leafId`) whose node set is exactly `taggedIds`, if one exists. */
export function pathMatchingTags(leafId: string, taggedIds: string[], index: NodeIndex): string[] | null {
  const tagged = new Set(taggedIds);
  return (
    rootPaths(leafId, index).find((p) => p.length === tagged.size && p.every((id) => tagged.has(id))) ?? null
  );
}
