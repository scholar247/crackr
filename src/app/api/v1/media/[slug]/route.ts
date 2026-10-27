import { requireAuth, optionalAuth } from '@/server/auth/require-auth';
import { mediaService, MediaNotFoundError, MediaAuthorizationError } from '@/server/media/media.service';
import { toMediaResponse } from '@/server/media/media-response';
import { apiError, apiSuccess } from '@/lib/utils';

// Public-vs-authenticated read access is a single config knob (MEDIA_PUBLIC_ACCESS),
// enforced inside media.service.ts#getMetadata — this route stays the same either way.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await optionalAuth();

  try {
    const row = await mediaService.getMetadata(slug, viewer);
    return apiSuccess(toMediaResponse(row));
  } catch (err) {
    if (err instanceof MediaNotFoundError) return apiError('Not found', 404);
    if (err instanceof MediaAuthorizationError) return apiError('Forbidden', 403);
    throw err;
  }
}

// Owner or admin only, regardless of MEDIA_PUBLIC_ACCESS — delete is never public.
export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  try {
    await mediaService.remove(slug, { userId: session!.user.id, role: session!.user.role });
    return apiSuccess({ slug });
  } catch (err) {
    if (err instanceof MediaNotFoundError) return apiError('Not found', 404);
    if (err instanceof MediaAuthorizationError) return apiError('Forbidden', 403);
    throw err;
  }
}
