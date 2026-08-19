/**
 * Fetch API `Headers`/`Response` values must be valid ByteStrings (Latin1 only) — any
 * originalFileName containing a character above code point 255 (accented letters, CJK,
 * typographic punctuation like U+2019/U+202F, emoji, ...) throws a hard TypeError if
 * dropped straight into a header string. sanitizeFilename() only strips control
 * characters and path separators, not non-Latin1 text, so this has to be handled
 * separately at the one place a filename becomes a header value.
 *
 * Builds a spec-compliant (RFC 6266 + RFC 5987) header with both an ASCII-safe
 * `filename=` fallback for older clients and a `filename*=UTF-8''...` extended form so
 * modern browsers still show the real name.
 */
export function buildContentDisposition(filename: string, disposition: 'inline' | 'attachment' = 'inline'): string {
  const asciiFallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_').trim() || 'file';
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
