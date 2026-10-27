/**
 * Server-side defense-in-depth for Markdown revision bodies. The Tiptap
 * editor's own extension set can't produce raw HTML/scripts/iframes, but a
 * direct API call bypasses the client entirely — this is the real boundary
 * ("sanitize/validate URLs and content server-side even if the client editor
 * limits them"). Code blocks are excluded from the scan so legitimate code
 * samples (e.g. an article showing `<script>` as text) aren't flagged.
 */

const DANGEROUS_HTML_TAG = /<\s*(script|iframe|object|embed|style|link|meta|form)\b/i;
const EVENT_HANDLER_ATTRIBUTE = /\son[a-z]+\s*=/i;
const UNSAFE_URL_SCHEME = /\]\(\s*(javascript:|data:|vbscript:|file:)/i;

function stripCodeBlocks(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ');
}

/** Returns a list of human-readable violation messages; empty means safe. */
export function findUnsafeMarkdownContent(markdown: string): string[] {
  const text = stripCodeBlocks(markdown ?? '');
  const issues: string[] = [];
  if (DANGEROUS_HTML_TAG.test(text)) issues.push('Content contains a disallowed HTML tag');
  if (EVENT_HANDLER_ATTRIBUTE.test(text)) issues.push('Content contains an inline event handler attribute');
  if (UNSAFE_URL_SCHEME.test(text)) issues.push('Content contains a link or image with an unsafe URL scheme');
  return issues;
}
