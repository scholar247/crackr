import { requireAuth } from '@/server/auth/require-auth';
import { mediaService } from '@/server/media/media.service';
import { MediaValidationError } from '@/server/media/validators';
import { toMediaResponse } from '@/server/media/media-response';
import { mediaConfig } from '@/lib/media-config';
import { apiError, apiSuccess } from '@/lib/utils';

// Any authenticated user can upload — this module is shared infrastructure (resumes,
// course resources, profile photos, community/assessment attachments, ...), not gated to
// one role or feature.
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Cheap early rejection using the client-declared Content-Length, before buffering the
  // whole multipart body — multipart framing adds some overhead beyond the raw file size,
  // so this check is intentionally generous; validateUpload() enforces the exact limit
  // against the real decoded bytes below.
  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (declaredLength > 0 && declaredLength > mediaConfig.maxFileSize * 2) {
    return apiError(`File exceeds the maximum allowed size of ${Math.floor(mediaConfig.maxFileSize / (1024 * 1024))} MB`, 413);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError('Invalid multipart form data', 400);
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return apiError('Missing "file" field', 400);

  // Optional — a caller can pick their own URL slug instead of one auto-derived from the
  // filename. See media.service.ts#resolveSlug for the availability-check semantics.
  const slugField = formData.get('slug');
  const requestedSlug = typeof slugField === 'string' && slugField.trim() ? slugField.trim() : undefined;

  try {
    const record = await mediaService.upload({ file, originalFileName: file.name, uploadedBy: session!.user.id, requestedSlug });
    return apiSuccess(toMediaResponse(record), undefined, 201);
  } catch (err) {
    if (err instanceof MediaValidationError) return apiError(err.message, 400);
    console.error('[media] upload API error', { uploadedBy: session!.user.id, error: err instanceof Error ? err.message : err });
    return apiError('Could not upload file', 500);
  }
}
