/**
 * Estimate reading time from Markdown content: ~200 words per minute.
 * Extracted from the legacy `mongo/blog.repository.ts` so it's directly
 * unit-testable and shared by the workflow service. Always derived
 * server-side — never trust a client-supplied reading time.
 */
export function calcReadingTime(markdownContent: string): number {
  const text = (markdownContent ?? '')
    .replace(/```[\s\S]*?```/g, ' ')       // fenced code blocks
    .replace(/`[^`]*`/g, ' ')              // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> keep link text
    .replace(/^:::.*$/gm, ' ')             // callout fences
    .replace(/^#{1,6}\s+/gm, '')           // heading markers
    .replace(/^\s*>+\s?/gm, '')            // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, '')         // bullet list markers
    .replace(/^\s*\d+\.\s+/gm, '')         // ordered list markers
    .replace(/[*_~#|]/g, ' ');             // remaining emphasis/table/heading chars
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
