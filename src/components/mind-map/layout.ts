import type { MindMapTreeNode } from '@/lib/mind-maps';

// Pure two-sided tree layout for a mind map. The chapter sits at the origin; main topics
// are split left/right (balanced by subtree size, so a branch never jumps sides when it
// expands), and each side is laid out as a tidy tree using only *visible* nodes — collapsed
// branches take no space and aren't rendered at all.

export const SIZES = {
  center: { w: 232, h: 92 },
  topic: { w: 208, h: 56 },
  sub: { w: 188, h: 48 },
  gapX: 56,
  gapY: 14,
} as const;

export interface LaidOutNode {
  id: string;
  label: string;
  depth: number; // 1 = main topic
  side: 1 | -1; // 1 = right of centre
  branch: number; // index of the main topic it descends from (drives colour)
  x: number; // left edge
  y: number; // top edge
  w: number;
  h: number;
  parentId: string | null;
  childCount: number;
  expanded: boolean;
}

export interface LaidOutLink {
  id: string; // child id
  d: string; // SVG path
  branch: number;
  depth: number;
}

export interface MindMapLayout {
  nodes: LaidOutNode[];
  links: LaidOutLink[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

const sizeFor = (depth: number) => (depth === 1 ? SIZES.topic : SIZES.sub);

function weight(n: MindMapTreeNode): number {
  return n.children.length === 0 ? 1 : n.children.reduce((s, c) => s + weight(c), 0);
}

/** Which side each main topic goes on — greedy balance by full subtree size (stable). */
export function assignSides(roots: MindMapTreeNode[]): (1 | -1)[] {
  let right = 0;
  let left = 0;
  return roots.map((r) => {
    const w = weight(r);
    if (right <= left) {
      right += w;
      return 1;
    }
    left += w;
    return -1;
  });
}

function curve(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function layoutMindMap(roots: MindMapTreeNode[], expanded: ReadonlySet<string>): MindMapLayout {
  const nodes: LaidOutNode[] = [];
  const links: LaidOutLink[] = [];
  const sides = assignSides(roots);

  const visibleHeight = (n: MindMapTreeNode, depth: number): number => {
    const own = sizeFor(depth).h;
    if (!expanded.has(n.id) || n.children.length === 0) return own;
    const kids = n.children.reduce((s, c) => s + visibleHeight(c, depth + 1), 0) + SIZES.gapY * (n.children.length - 1);
    return Math.max(own, kids);
  };

  const place = (n: MindMapTreeNode, depth: number, side: 1 | -1, branch: number, edge: number, cy: number, parent: { id: string | null; ax: number; ay: number }) => {
    const { w, h } = sizeFor(depth);
    const x = side === 1 ? edge : edge - w;
    const isOpen = expanded.has(n.id) && n.children.length > 0;
    nodes.push({ id: n.id, label: n.label, depth, side, branch, x, y: cy - h / 2, w, h, parentId: parent.id, childCount: n.children.length, expanded: isOpen });
    links.push({ id: n.id, d: curve(parent.ax, parent.ay, side === 1 ? x : x + w, cy), branch, depth });

    if (!isOpen) return;
    const total = n.children.reduce((s, c) => s + visibleHeight(c, depth + 1), 0) + SIZES.gapY * (n.children.length - 1);
    let cursor = cy - total / 2;
    const childEdge = side === 1 ? x + w + SIZES.gapX : x - SIZES.gapX;
    const anchor = { id: n.id, ax: side === 1 ? x + w : x, ay: cy };
    for (const c of n.children) {
      const vh = visibleHeight(c, depth + 1);
      place(c, depth + 1, side, branch, childEdge, cursor + vh / 2, anchor);
      cursor += vh + SIZES.gapY;
    }
  };

  for (const side of [1, -1] as const) {
    const entries = roots.map((r, i) => ({ r, i })).filter(({ i }) => sides[i] === side);
    const total = entries.reduce((s, { r }) => s + visibleHeight(r, 1), 0) + SIZES.gapY * Math.max(0, entries.length - 1);
    let cursor = -total / 2;
    const edge = side * (SIZES.center.w / 2 + SIZES.gapX);
    const anchor = { id: null, ax: (side * SIZES.center.w) / 2, ay: 0 };
    for (const { r, i } of entries) {
      const vh = visibleHeight(r, 1);
      place(r, 1, side, i, edge, cursor + vh / 2, anchor);
      cursor += vh + SIZES.gapY;
    }
  }

  const bounds = { minX: -SIZES.center.w / 2, minY: -SIZES.center.h / 2, maxX: SIZES.center.w / 2, maxY: SIZES.center.h / 2 };
  for (const n of nodes) {
    bounds.minX = Math.min(bounds.minX, n.x);
    bounds.minY = Math.min(bounds.minY, n.y);
    bounds.maxX = Math.max(bounds.maxX, n.x + n.w);
    bounds.maxY = Math.max(bounds.maxY, n.y + n.h);
  }
  return { nodes, links, bounds };
}

/** Zoom/pan that fits `bounds` into a viewport (origin at the viewport centre). */
export function fitView(bounds: MindMapLayout['bounds'], viewport: { w: number; h: number }, opts = { padding: 48, min: 0.3, max: 1.2 }) {
  const bw = bounds.maxX - bounds.minX;
  const bh = bounds.maxY - bounds.minY;
  const k = Math.min(opts.max, Math.max(opts.min, Math.min((viewport.w - opts.padding) / bw, (viewport.h - opts.padding) / bh)));
  return { k, tx: -(bounds.minX + bw / 2) * k, ty: -(bounds.minY + bh / 2) * k };
}

/** Ids of every node that has children — "expand all". */
export function expandableIds(roots: MindMapTreeNode[], out = new Set<string>()): Set<string> {
  for (const n of roots) {
    if (n.children.length > 0) {
      out.add(n.id);
      expandableIds(n.children, out);
    }
  }
  return out;
}

/** Nodes whose label matches a search, plus every ancestor id (to reveal them). */
export function searchTree(roots: MindMapTreeNode[], query: string) {
  const q = query.trim().toLowerCase();
  const matches: string[] = [];
  const reveal = new Set<string>();
  if (q.length < 2) return { matches, reveal };
  const visit = (nodes: MindMapTreeNode[], ancestors: string[]) => {
    for (const n of nodes) {
      if (n.label.toLowerCase().includes(q) || (n.description ?? '').toLowerCase().includes(q)) {
        matches.push(n.id);
        for (const a of ancestors) reveal.add(a);
      }
      visit(n.children, [...ancestors, n.id]);
    }
  };
  visit(roots, []);
  return { matches, reveal };
}
