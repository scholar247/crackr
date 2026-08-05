import { slugify } from '@/lib/utils';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3 | 4;
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
  // Drop fenced code blocks first so `## ` inside a code sample isn't
  // mistaken for a heading (same defensive pattern as markdown-safety.ts).
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, '');

  const headings: TocHeading[] = [];
  const seenIds = new Map<string, number>();

  for (const line of withoutCodeBlocks.split('\n')) {
    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length as 2 | 3 | 4;
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;

    let id = slugify(text) || 'section';
    const count = seenIds.get(id) ?? 0;
    seenIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    headings.push({ id, text, level });
  }

  return headings;
}
