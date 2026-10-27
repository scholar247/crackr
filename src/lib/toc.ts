import { slugify } from '@/lib/utils';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  /** 1-indexed source line — matches remark/rehype's `node.position.start.line`. */
  line: number;
}

/** Strips common inline Markdown syntax so heading text reads cleanly in the TOC. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/~~([^~]*)~~/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim();
}

/**
 * Extracts H2–H4 headings from Markdown source (matching the editor's own
 * heading-level restriction) for the reader's table of contents. Ids use
 * the same `slugify()` as everywhere else in the app, so `BlogContent`'s
 * heading renderers and this list always agree on anchor targets — dedupes
 * collisions (two headings with the same text) with a numeric suffix.
 */
export function extractHeadings(markdown: string): TocHeading[] {
  // Drop fenced code blocks first so `## ` inside a code sample isn't mistaken for a
  // heading (same defensive pattern as markdown-safety.ts) — replaced with a matching
  // number of blank lines (not removed outright) so every later line's index still lines
  // up with the original source, matching remark's node.position.start.line exactly.
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, (block) => '\n'.repeat(block.split('\n').length - 1));

  const headings: TocHeading[] = [];
  const seenIds = new Map<string, number>();

  const lines = withoutCodeBlocks.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(lines[i]);
    if (!match) continue;
    const level = match[1].length as 2 | 3 | 4;
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;

    let id = slugify(text) || 'section';
    const count = seenIds.get(id) ?? 0;
    seenIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    headings.push({ id, text, level, line: i + 1 });
  }

  return headings;
}
