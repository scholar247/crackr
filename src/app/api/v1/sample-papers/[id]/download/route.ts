import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/require-auth';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { linkFor, openPdf, parseDoc, pdfFilename } from '@/server/services/sample-paper-file';
import { samplePapersPath } from '@/lib/sample-papers';
import { apiError } from '@/lib/utils';

// Signed-in download of a published paper or marking scheme. Each successful download is
// recorded (sample_paper_downloads) before the file is sent as an attachment.
//
// Reached by a plain link click, so a signed-out visitor is redirected to sign-in and
// brought back to the paper page afterwards instead of seeing a JSON 401. Not under
// /api/v1/public: it needs a real user to record against.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = parseDoc(new URL(req.url).searchParams.get('doc'));

  const paper = await samplePaperRepository.findById(id);
  if (!paper || !paper.isPublished) return apiError('Not found', 404);

  const { session, error, isServiceKey } = await requireAuth();
  if (error) {
    if (error.status !== 401) return error;
    const exam = await taxonomyRepository.findExamById(paper.examId);
    const back = exam ? samplePapersPath(exam.slug, paper.year, paper.subjectSlug) : '/';
    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${encodeURIComponent(back)}`, req.url));
  }
  // The seed-script service key has no users row to attribute a download to.
  if (isServiceKey) return apiError('Downloads require a signed-in user', 403);

  const link = linkFor(paper, doc);
  if (!link) return apiError('Not found', 404);

  const body = await openPdf(link);
  if (!body) return apiError('Could not load the PDF', 502);

  // Only log once we know the file is actually being sent.
  await samplePaperRepository.recordDownload({
    samplePaperId: paper.id,
    userId: session!.user.id,
    document: doc === 'scheme' ? 'SCHEME' : 'PAPER',
    userAgent: req.headers.get('user-agent'),
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFilename(paper, doc)}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
