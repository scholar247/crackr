import { mediaService, MediaNotFoundError } from '@/server/media/media.service';
import { MEDIA_CONTENT_LINK, type SamplePaperDoc } from '@/lib/sample-papers';
import type { SamplePaper } from '@/server/repositories/sample-paper.repository';

const FETCH_TIMEOUT_MS = 20_000;

// Shared by the inline viewer route (/api/v1/public/sample-papers/{id}/file) and the
// signed-in download route (/api/v1/sample-papers/{id}/download): resolves a paper's
// stored link to a byte stream without ever exposing the link itself.

export function linkFor(paper: SamplePaper, doc: SamplePaperDoc): string | null {
  return doc === 'scheme' ? paper.markingSchemeLink : paper.samplePaperLink;
}

/** "mathematics-standard-2026-marking-scheme.pdf" — what the visitor sees, never the source name. */
export function pdfFilename(paper: SamplePaper, doc: SamplePaperDoc): string {
  return `${paper.subjectSlug}-${paper.year}-${doc === 'scheme' ? 'marking-scheme' : 'sample-paper'}.pdf`;
}

export function parseDoc(raw: string | null): SamplePaperDoc {
  return raw === 'scheme' ? 'scheme' : 'paper';
}

/** Opens a stored link (uploaded media or http(s) URL) as a stream; null if unavailable. */
export async function openPdf(link: string): Promise<ReadableStream<Uint8Array> | null> {
  const media = MEDIA_CONTENT_LINK.exec(link);
  if (media) {
    try {
      // Media attached to a paper follows the paper's access rules (published = public,
      // checked by the calling route), not the media module's per-viewer ones, which would
      // refuse anonymous visitors whenever MEDIA_PUBLIC_ACCESS is off.
      const content = await mediaService.getContentAsSystem(media[1]);
      if (content.kind === 'stream') return content.stream;
      return fetchRemote(content.url);
    } catch (err) {
      if (err instanceof MediaNotFoundError) return null;
      throw err;
    }
  }
  return /^https?:\/\//i.test(link) ? fetchRemote(link) : null;
}

async function fetchRemote(url: string): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok || !res.body) return null;
    return res.body;
  } catch (err) {
    console.error('[sample-papers] remote PDF fetch failed', { url, error: err instanceof Error ? err.message : err });
    return null;
  }
}
