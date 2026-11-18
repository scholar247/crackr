import { MIND_MAP_LIMITS, type MindMapTreeNode } from './mind-maps';

// Import an outline into a mind map: Markdown bullets/headings, plain indented text, or
// OPML (exported by most mind-map and outliner apps: XMind, MindNode, Workflowy, …).
// Pure and dependency-free; ids come from `makeId` so tests are deterministic.

export interface ImportResult {
  nodes: MindMapTreeNode[];
  count: number;
  /** Lines/labels that were cut to fit the label limit. */
  truncated: number;
  format: 'opml' | 'markdown' | 'text';
}

const node = (label: string, makeId: () => string): MindMapTreeNode => ({ id: makeId(), label, description: null, content: null, curriculumNodeId: null, children: [] });

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function parseOpml(xml: string, makeId: () => string): MindMapTreeNode[] {
  const roots: MindMapTreeNode[] = [];
  const stack: MindMapTreeNode[][] = [roots];
  // <outline ... text="…" …> / <outline … /> / </outline>
  const re = /<outline\b([^>]*?)(\/?)>|<\/outline>/gi;
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    if (m[0].startsWith('</')) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attr = /\btext\s*=\s*"([^"]*)"/i.exec(m[1]) ?? /\btitle\s*=\s*"([^"]*)"/i.exec(m[1]);
    const n = node(decodeEntities(attr?.[1] ?? '').trim() || 'Untitled', makeId);
    stack[stack.length - 1].push(n);
    if (m[2] !== '/') stack.push(n.children);
  }
  return roots;
}

/**
 * Markdown / indented text. Depth comes from headings (#, ##, …) and from list indentation
 * (tabs or spaces, any consistent step). A single top-level heading wrapping everything is
 * treated as the map title and dropped, so its children become the main topics.
 */
function parseOutline(text: string, makeId: () => string): MindMapTreeNode[] {
  type Line = { level: number; label: string; heading: boolean };
  const lines: Line[] = [];
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!raw.trim()) continue;
    const heading = /^(#{1,6})\s+(.*)$/.exec(raw.trim());
    if (heading) {
      lines.push({ level: heading[1].length - 1, label: heading[2], heading: true });
      continue;
    }
    const indent = raw.match(/^[\t ]*/)![0].replace(/\t/g, '    ').length;
    const label = raw
      .trim()
      .replace(/^([-*+•]|\d+[.)])\s+/, '')
      .replace(/^\[[ xX]\]\s+/, '');
    lines.push({ level: indent, label, heading: false });
  }
  // List items nest under the most recent heading: offset them below it, and turn raw
  // indentation widths into consecutive depths.
  const out: { depth: number; label: string }[] = [];
  let headingDepth = -1;
  const indents: number[] = [];
  for (const l of lines) {
    if (l.heading) {
      headingDepth = l.level;
      indents.length = 0;
      out.push({ depth: l.level, label: l.label });
      continue;
    }
    while (indents.length && indents[indents.length - 1] > l.level) indents.pop();
    if (!indents.length || indents[indents.length - 1] < l.level) indents.push(l.level);
    out.push({ depth: headingDepth + indents.length, label: l.label });
  }
  // Single wrapping title → drop it.
  const minDepth = Math.min(...out.map((o) => o.depth));
  const tops = out.filter((o) => o.depth === minDepth);
  const items = tops.length === 1 && out.length > 1 && out[0].depth === minDepth ? out.slice(1) : out;

  const roots: MindMapTreeNode[] = [];
  const stack: { depth: number; children: MindMapTreeNode[] }[] = [{ depth: -Infinity, children: roots }];
  for (const it of items) {
    while (stack.length > 1 && stack[stack.length - 1].depth >= it.depth) stack.pop();
    const n = node(it.label.replace(/\*\*|__/g, '').trim(), makeId);
    stack[stack.length - 1].children.push(n);
    stack.push({ depth: it.depth, children: n.children });
  }
  return roots;
}

export function importOutline(input: string, makeId: () => string = () => crypto.randomUUID()): ImportResult {
  const isOpml = /<opml[\s>]/i.test(input) || /<outline\b/i.test(input);
  const isMarkdown = !isOpml && /^\s*(#{1,6}\s|[-*+]\s)/m.test(input);
  const nodes = isOpml ? parseOpml(input, makeId) : parseOutline(input, makeId);

  let count = 0;
  let truncated = 0;
  const fit = (list: MindMapTreeNode[], depth: number): MindMapTreeNode[] =>
    list.flatMap((n) => {
      if (count >= MIND_MAP_LIMITS.maxNodes) return [];
      count++;
      let label = n.label;
      if (label.length > MIND_MAP_LIMITS.label) {
        label = `${label.slice(0, MIND_MAP_LIMITS.label - 1)}…`;
        truncated++;
      }
      // Deeper than allowed → flatten onto the deepest allowed level.
      const children = depth >= MIND_MAP_LIMITS.maxDepth ? [] : fit(n.children, depth + 1);
      return [{ ...n, label, children }];
    });
  const fitted = fit(nodes, 1);
  return { nodes: fitted, count, truncated, format: isOpml ? 'opml' : isMarkdown ? 'markdown' : 'text' };
}

/** The map as an indented Markdown outline (export / round-trip). */
export function toMarkdownOutline(title: string, nodes: MindMapTreeNode[]): string {
  const lines = [`# ${title}`, ''];
  const walk = (list: MindMapTreeNode[], depth: number) => {
    for (const n of list) {
      lines.push(`${'  '.repeat(depth)}- ${n.label}`);
      walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return lines.join('\n') + '\n';
}
