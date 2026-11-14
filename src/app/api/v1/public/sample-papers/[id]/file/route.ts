import { optionalAuth } from '@/server/auth/require-auth';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { linkFor, openPdf, parseDoc, pdfFilename } from '@/server/services/sample-paper-file';
import { isAdmin } from '@/lib/roles';
import { apiError } from '@/lib/utils';

// Serves a sample paper's PDF to the on-site viewer (components/sample-papers/pdf-viewer).
//
// - The stored link (media slug or external URL) is never sent to the browser; the viewer
//   only knows this id-based URL.
// - Always `inline`, never `attachment`, and requests that aren't a same-origin fetch from
//   our own page (typing the URL in the address bar, another site hotlinking it) are
//   refused — the browser's native PDF viewer, with its download button, never gets it.
//   Saving a copy goes through the signed-in /api/v1/sample-papers/{id}/download instead.
// - noindex: Google should index the HTML page around the paper, not the raw PDF.
//
// Published papers only, except admins previewing drafts.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Browsers send Sec-Fetch-Site on every request; only enforce it when present so older
  // clients still work.
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return apiError('Not available', 403);

  const { id } = await params;
  const doc = parseDoc(new URL(req.url).searchParams.get('doc'));

  const paper = await samplePaperRepository.findById(id);
  if (!paper) return apiError('Not found', 404);
  if (!paper.isPublished) {
    const viewer = await optionalAuth();
    if (!viewer.role || !isAdmin(viewer.role)) return apiError('Not found', 404);
  }

  const link = linkFor(paper, doc);
  if (!link) return apiError('Not found', 404);

  const body = await openPdf(link);
  if (!body) return apiError('Could not load the PDF', 502);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${pdfFilename(paper, doc)}"`,
      // Browser-only and short: a shared/CDN copy would outlive an unpublish or file
      // replacement (admin purges don't reach it) and would answer cross-site requests
      // without re-running the Sec-Fetch-Site check above.
      'Cache-Control': paper.isPublished ? 'private, max-age=300' : 'private, no-store',
      Vary: 'Sec-Fetch-Site',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
}
