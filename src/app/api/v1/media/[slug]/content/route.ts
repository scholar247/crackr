import { optionalAuth } from '@/server/auth/require-auth';
import { mediaService, MediaNotFoundError, MediaAuthorizationError } from '@/server/media/media.service';
import { buildContentDisposition } from '@/server/media/content-disposition';
import { mediaConfig } from '@/lib/media-config';
import { apiError } from '@/lib/utils';

// The stable, provider-agnostic serving URL every consumer should link to
// (`/api/v1/media/{slug}/content`, as returned by toMediaResponse). What happens here
// depends entirely on what the active FileStorageProvider supports:
//   - LocalFileStorageProvider never exposes an access URL, so this streams bytes
//     straight through the app server.
//   - A future S3/R2 provider that implements getAccessUrl() would make this issue a
//     302 to a signed/public URL instead — see media.service.ts#getContent.
// No caller of this route needs to know which case it's in.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await optionalAuth();

  try {
    const content = await mediaService.getContent(slug, viewer);

    if (content.kind === 'redirect') {
      return Response.redirect(content.url, 302);
    }

    return new Response(content.stream, {
      status: 200,
      headers: {
        'Content-Type': content.contentType,
        'Content-Length': String(content.contentLength),
        'Content-Disposition': buildContentDisposition(content.filename),
        'Cache-Control': mediaConfig.publicAccess ? 'public, max-age=31536000, immutable' : 'private, no-store',
      },
    });
  } catch (err) {
    if (err instanceof MediaNotFoundError) return apiError('Not found', 404);
    if (err instanceof MediaAuthorizationError) return apiError('Forbidden', 403);
    throw err;
  }
}
