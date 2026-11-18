import type { MindMapTreeNode } from '@/lib/mind-maps';

// Pure two-sided tree layout for a mind map. The chapter sits at the origin; main topics
// are split left/right (balanced by subtree size, so a branch never jumps sides when it
// expands), and each side is laid out as a tidy tree using only *visible* nodes — collapsed
// branches take no space and aren't rendered at all.

export const SIZES = {
  center: { w: 240, h: 112 },
  topic: { w: 208, h: 56 }, // minimum box for a main topic
  sub: { w: 188, h: 48 }, // minimum box for deeper nodes
  gapX: 64,
  gapY: 12,
} as const;

// ── Text measurement ───────────────────────────────────────────────────────────
// Boxes are sized to their (wrapped) text so a full-sentence fact is shown whole instead of
// being cut off. Layout must be identical on the server and in the browser, so text is
// measured with a deterministic per-character width estimate (slightly generous, so the
// browser's real wrapping never needs more lines than the box has room for).

/** Typography per level — the component renders with exactly these sizes. */
export const TYPE = {
  topic: { font: 15, line: 20, bold: true, minW: 150, maxW: 280, minH: 52, padX: 14, padY: 12, reserve: 30 },
  sub: { font: 13, line: 18, bold: false, minW: 120, maxW: 260, minH: 40, padX: 12, padY: 10, reserve: 38 },
  heading: { font: 14, line: 19, bold: true, minW: 120, maxW: 260, minH: 36, padX: 12, padY: 8, reserve: 30 },
  tagRow: 20,
} as const;

export type TypeSpec = (typeof TYPE)['topic' | 'sub' | 'heading'];

export function typeFor(depth: number, n?: Pick<MindMapTreeNode, 'style'>): TypeSpec {
  if (depth === 1) return TYPE.topic;
  return n?.style?.heading ? TYPE.heading : TYPE.sub;
}

const NARROW = new Set("ijlItf.,:;'!|()[]{} ");
const WIDE = new Set('mwMW@%');

/** Estimated rendered width of `text` in px (Latin, digits and Devanagari). */
export function textWidth(text: string, font: number, bold = false): number {
  let em = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x0900 && c <= 0x097f) {
      // Devanagari: vowel signs and marks attach to the previous letter.
      const mark = (c >= 0x0900 && c <= 0x0903) || (c >= 0x093a && c <= 0x094f) || (c >= 0x0951 && c <= 0x0957) || c === 0x0962 || c === 0x0963;
      em += mark ? 0.12 : 0.64;
    } else if (NARROW.has(ch)) em += ch === ' ' ? 0.28 : 0.3;
    else if (WIDE.has(ch)) em += 0.86;
    else if (ch >= 'A' && ch <= 'Z') em += 0.68;
    else if (ch >= '0' && ch <= '9') em += 0.57;
    else em += 0.54;
  }
  return em * font * (bold ? 1.07 : 1) * 1.06;
}

/** Greedy word wrap → line count and widest line, for a content width. */
export function wrapText(text: string, maxWidth: number, font: number, bold = false): { lines: number; width: number } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: 1, width: 0 };
  const space = textWidth(' ', font, bold);
  let lines = 1;
  let line = 0;
  let widest = 0;
  for (const w of words) {
    let ww = textWidth(w, font, bold);
    if (line > 0 && line + space + ww <= maxWidth) {
      line += space + ww;
    } else {
      if (line > 0) {
        widest = Math.max(widest, line);
        lines++;
      }
      // A single word longer than the line breaks across lines.
      while (ww > maxWidth) {
        lines++;
        ww -= maxWidth;
        widest = maxWidth;
      }
      line = ww;
    }
  }
  return { lines, width: Math.max(widest, line) };
}

/** Box size for a node in the radial layout. */
export function measureNode(n: Pick<MindMapTreeNode, 'label' | 'style' | 'tags'>, depth: number): { w: number; h: number } {
  const t = typeFor(depth, n);
  const content = t.maxW - t.padX * 2 - t.reserve;
  const { lines, width } = wrapText(n.label, content, t.font, t.bold);
  const w = Math.ceil(Math.min(t.maxW, Math.max(t.minW, width + t.padX * 2 + t.reserve)));
  const h = Math.ceil(Math.max(t.minH, lines * t.line + t.padY * 2 + (n.tags?.length ? TYPE.tagRow : 0)));
  return { w, h };
}

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
  /** Box of the central chapter node; absent → SIZES.center around the origin (radial). */
  centre?: { x: number; y: number; w: number; h: number };
}

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

/**
 * Brace-style connector: a short shared stem out of the parent, then a smooth curve to the
 * child. Siblings share the stem, so a parent's children read as one "{" group.
 */
function brace(x1: number, y1: number, x2: number, y2: number) {
  const fx = x1 + (x2 - x1) * 0.32;
  const dx = (x2 - fx) / 2;
  return `M ${x1} ${y1} H ${fx} C ${fx + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/**
 * Bus connector to a topic in a side's outer column: out of the centre along y = 0 (through
 * the corridor kept free in the inner column), along a vertical spine in the gutter between
 * the columns, then into the topic.
 */
function bus(ax: number, spine: number, tx: number, cy: number) {
  const side = Math.sign(tx - spine) || 1;
  const dir = Math.sign(cy) || 1;
  const r = Math.min(12, Math.abs(cy), Math.abs(tx - spine));
  return `M ${ax} 0 H ${spine} V ${cy - dir * r} Q ${spine} ${cy} ${spine + side * r} ${cy} H ${tx}`;
}

const CORRIDOR = 28;
const LANDSCAPE = { w: 1123, h: 794 }; // A4 landscape at 96 dpi

export type ColumnCount = 1 | 2 | 3;

/**
 * Columns of topics per side (1–3). Many topics in one column make a tall strip that is
 * unreadable on a landscape screen or page; extra columns trade height for width. Picks the
 * count that fits a landscape page best, decided on the fully expanded map so topics never
 * jump columns as branches open and close.
 */
export function chooseColumns(roots: MindMapTreeNode[]): ColumnCount {
  if (roots.length < 12) return 1;
  const all = expandableIds(roots);
  const fit = (l: MindMapLayout) => Math.min(LANDSCAPE.w / (l.bounds.maxX - l.bounds.minX), LANDSCAPE.h / (l.bounds.maxY - l.bounds.minY));
  let best: ColumnCount = 1;
  let bestFit = fit(layoutMindMap(roots, all, { columns: 1 }));
  for (const c of [2, 3] as const) {
    if (roots.length < c * 8) break;
    const f = fit(layoutMindMap(roots, all, { columns: c }));
    if (f > bestFit * 1.1) {
      best = c;
      bestFit = f;
    }
  }
  return best;
}

export function layoutMindMap(roots: MindMapTreeNode[], expanded: ReadonlySet<string>, opts: { columns?: ColumnCount } = {}): MindMapLayout {
  const columns = opts.columns ?? chooseColumns(roots);
  const nodes: LaidOutNode[] = [];
  const links: LaidOutLink[] = [];
  const sides = assignSides(roots);

  const sizes = new Map<string, { w: number; h: number }>();
  const sizeOf = (n: MindMapTreeNode, depth: number) => {
    let size = sizes.get(n.id);
    if (!size) sizes.set(n.id, (size = measureNode(n, depth)));
    return size;
  };
  const visibleHeight = (n: MindMapTreeNode, depth: number): number => {
    const own = sizeOf(n, depth).h;
    if (!expanded.has(n.id) || n.children.length === 0) return own;
    const kids = n.children.reduce((s, c) => s + visibleHeight(c, depth + 1), 0) + SIZES.gapY * (n.children.length - 1);
    return Math.max(own, kids);
  };

  const place = (n: MindMapTreeNode, depth: number, side: 1 | -1, branch: number, edge: number, cy: number, parent: { id: string | null; ax: number; ay: number; spine?: number }) => {
    const { w, h } = sizeOf(n, depth);
    const x = side === 1 ? edge : edge - w;
    const isOpen = expanded.has(n.id) && n.children.length > 0;
    nodes.push({ id: n.id, label: n.label, depth, side, branch, x, y: cy - h / 2, w, h, parentId: parent.id, childCount: n.children.length, expanded: isOpen });
    const tx = side === 1 ? x : x + w;
    const d = parent.spine !== undefined ? bus(parent.ax, parent.spine, tx, cy) : (depth === 1 ? curve : brace)(parent.ax, parent.ay, tx, cy);
    links.push({ id: n.id, d, branch, depth });

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

  type Entry = { r: MindMapTreeNode; i: number };
  const heightOf = (list: Entry[]) => (list.length ? list.reduce((s, { r }) => s + visibleHeight(r, 1), 0) + SIZES.gapY * (list.length - 1) : 0);

  for (const side of [1, -1] as const) {
    const entries: Entry[] = roots.map((r, i) => ({ r, i })).filter(({ i }) => sides[i] === side);
    const anchor = { id: null, ax: (side * SIZES.center.w) / 2, ay: 0 };
    const stack = (list: Entry[], top: number, x: number, via: typeof anchor & { spine?: number }) => {
      let cursor = top;
      for (const { r, i } of list) {
        const vh = visibleHeight(r, 1);
        place(r, 1, side, i, x, cursor + vh / 2, via);
        cursor += vh + SIZES.gapY;
      }
    };
    // Topics split into consecutive columns; every column but the last keeps a corridor
    // free at y = 0 so the bus lines to the columns beyond it can pass.
    const count = Math.min(columns, Math.max(1, Math.floor(entries.length / 3)));
    const per = Math.ceil(entries.length / count);
    const chunks = Array.from({ length: count }, (_, c) => entries.slice(c * per, (c + 1) * per)).filter((c) => c.length);
    let edge = side * (SIZES.center.w / 2 + SIZES.gapX);
    let parent: typeof anchor & { spine?: number } = anchor;
    chunks.forEach((chunk, c) => {
      const last = c === chunks.length - 1;
      const start = nodes.length;
      if (last) stack(chunk, -heightOf(chunk) / 2, edge, parent);
      else {
        const half = heightOf(chunk) / 2;
        let cut = 0;
        for (let acc = 0; cut < chunk.length - 1; cut++) {
          const vh = visibleHeight(chunk[cut].r, 1);
          if (acc + vh / 2 > half) break;
          acc += vh + SIZES.gapY;
        }
        const above = chunk.slice(0, cut);
        const below = chunk.slice(cut);
        stack(above, -CORRIDOR / 2 - heightOf(above), edge, parent);
        stack(below, CORRIDOR / 2, edge, parent);
        const placed = nodes.slice(start);
        const far = side === 1 ? Math.max(...placed.map((b) => b.x + b.w)) : Math.min(...placed.map((b) => b.x));
        // The next column sits beyond this one's deepest boxes, joined by a spine in the gutter.
        parent = { ...anchor, spine: far + side * SIZES.gapX * 0.8 };
        edge = far + side * SIZES.gapX * 1.6;
      }
    });
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
export function fitView(bounds: MindMapLayout['bounds'], viewport: { w: number; h: number }, opts = { padding: 48, min: 0.12, max: 1.2 }) {
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

/** Ids of every node in `root`'s subtree (root included). */
export function subtreeIds(root: MindMapTreeNode, out = new Set<string>()): Set<string> {
  out.add(root.id);
  for (const c of root.children) subtreeIds(c, out);
  return out;
}

/**
 * Bounds of the laid-out boxes in `ids` plus the central node — what focus mode frames, so
 * the open branch is shown together with the chapter it hangs off.
 */
export function branchBounds(layout: MindMapLayout, ids: ReadonlySet<string>): MindMapLayout['bounds'] {
  const b = { minX: -SIZES.center.w / 2, minY: -SIZES.center.h / 2, maxX: SIZES.center.w / 2, maxY: SIZES.center.h / 2 };
  for (const n of layout.nodes) {
    if (!ids.has(n.id)) continue;
    b.minX = Math.min(b.minX, n.x);
    b.minY = Math.min(b.minY, n.y);
    b.maxX = Math.max(b.maxX, n.x + n.w);
    b.maxY = Math.max(b.maxY, n.y + n.h);
  }
  return b;
}

/**
 * Nodes hidden in quiz mode: every subtopic (main topics stay visible as cues). A chapter
 * with no subtopics hides its main topics instead, so there is always something to recall.
 */
export function quizTargets(roots: MindMapTreeNode[]): string[] {
  const deep: string[] = [];
  const visit = (nodes: MindMapTreeNode[], depth: number) => {
    for (const n of nodes) {
      if (depth >= 2) deep.push(n.id);
      visit(n.children, depth + 1);
    }
  };
  visit(roots, 1);
  return deep.length > 0 ? deep : roots.map((r) => r.id);
}

// ── Vertical tree (phones) ─────────────────────────────────────────────────────
// On narrow screens a two-sided canvas means constant panning and pinching. The vertical
// tree instead stacks the chapter on top and every visible node in its own full-width row,
// children indented under their parent with elbow connectors — it scrolls with the page
// like any list, and every row is a large tap target.

export const VERTICAL = { centreH: 76, topicH: 56, subH: 48, gap: 10, indent: 24, trunk: 14 } as const;

function elbow(ax: number, ay: number, x: number, cy: number) {
  const r = Math.max(0, Math.min(10, x - ax, cy - ay));
  return `M ${ax} ${ay} V ${cy - r} Q ${ax} ${cy} ${ax + r} ${cy} H ${x}`;
}

export function layoutVertical(roots: MindMapTreeNode[], expanded: ReadonlySet<string>, width: number): MindMapLayout {
  const w = Math.max(240, width);
  const nodes: LaidOutNode[] = [];
  const links: LaidOutLink[] = [];
  const centre = { x: 0, y: 0, w, h: VERTICAL.centreH };
  let cursor = centre.h + VERTICAL.gap * 2;

  const place = (n: MindMapTreeNode, depth: number, branch: number, anchor: { id: string | null; ax: number; ay: number }) => {
    const x = VERTICAL.trunk * 2 + (depth - 1) * VERTICAL.indent;
    const t = typeFor(depth, n);
    // Rows are full width; the right side holds the progress ring / +N badge / info button.
    const { lines } = wrapText(n.label, Math.max(60, w - x - t.padX * 2 - t.reserve - 64), t.font, t.bold);
    const h = Math.ceil(Math.max(depth === 1 ? VERTICAL.topicH : VERTICAL.subH, lines * t.line + t.padY * 2 + (n.tags?.length ? TYPE.tagRow : 0)));
    const y = cursor;
    cursor += h + VERTICAL.gap;
    const isOpen = expanded.has(n.id) && n.children.length > 0;
    nodes.push({ id: n.id, label: n.label, depth, side: 1, branch, x, y, w: w - x, h, parentId: anchor.id, childCount: n.children.length, expanded: isOpen });
    links.push({ id: n.id, d: elbow(anchor.ax, anchor.ay, x, y + h / 2), branch, depth });
    if (!isOpen) return;
    for (const c of n.children) place(c, depth + 1, branch, { id: n.id, ax: x + VERTICAL.trunk, ay: y + h });
  };
  roots.forEach((r, i) => place(r, 1, i, { id: null, ax: VERTICAL.trunk, ay: centre.h }));

  return { nodes, links, centre, bounds: { minX: 0, minY: 0, maxX: w, maxY: nodes.length ? cursor - VERTICAL.gap : centre.h } };
}

// ── Progress & topic helpers ───────────────────────────────────────────────────

/** How many nodes of `root`'s branch (root included) are in `done`. */
export function subtreeProgress(root: MindMapTreeNode, done: ReadonlySet<string>): { done: number; total: number } {
  const ids = subtreeIds(root);
  let count = 0;
  for (const id of ids) if (done.has(id)) count++;
  return { done: count, total: ids.size };
}

/** The main topic (root) a node belongs to. */
export function topicOf(roots: MindMapTreeNode[], id: string): MindMapTreeNode | null {
  return roots.find((r) => subtreeIds(r).has(id)) ?? null;
}
