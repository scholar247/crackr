import crypto from 'node:crypto';
import { mediaRepository } from '@/server/repositories/media.repository';
import { getStorageProvider } from './storage/storage-provider-factory';
import { generateStorageKey } from './key-generator';
import { sanitizeFilename, validateUpload, MediaValidationError } from './validators';
import { mediaConfig } from '@/lib/media-config';
import { isAdmin, type UserRole } from '@/lib/roles';
import { slugify } from '@/lib/utils';
import { isDuplicateKeyError } from '@/server/db/helpers';
import type { MediaStorageProviderValue } from '@/server/db/schema/media';

const PROVIDER_VALUE: MediaStorageProviderValue = mediaConfig.storageProvider === 's3' ? 'S3' : 'LOCAL';

export class MediaNotFoundError extends Error {
  constructor() {
    super('Media not found');
    this.name = 'MediaNotFoundError';
  }
}

export class MediaAuthorizationError extends Error {
  constructor() {
    super('Not authorized to access this media');
    this.name = 'MediaAuthorizationError';
  }
}

export interface Viewer {
  userId: string | null;
  role: UserRole | null;
}

function canView(row: { uploadedBy: string }, viewer: Viewer): boolean {
  if (mediaConfig.publicAccess) return true;
  if (!viewer.userId) return false;
  if (viewer.userId === row.uploadedBy) return true;
  if (viewer.role && isAdmin(viewer.role)) return true;
  return false;
}

function canDelete(row: { uploadedBy: string }, actor: { userId: string; role: UserRole }): boolean {
  return actor.userId === row.uploadedBy || isAdmin(actor.role);
}

export interface UploadMediaInput {
  file: Blob;
  originalFileName: string;
  uploadedBy: string;
  /** Optional caller-chosen slug (see resolveSlug() below for how this differs from an auto-derived one). */
  requestedSlug?: string;
}

function slugBaseFromFilename(sanitizedFilename: string): string {
  const stem = sanitizedFilename.replace(/\.[a-zA-Z0-9]{1,16}$/, '');
  return slugify(stem) || 'file';
}

/**
 * A caller-supplied slug is treated as an intentional choice: it's checked for
 * availability and rejected outright (not silently renamed) if taken, *before* any bytes
 * are written to storage — "unique check before actual upload." An auto-derived slug (from
 * the filename) has no such expectation, so it's silently suffixed on collision via
 * mediaRepository.resolveUniqueSlug, same as communities.slug.
 */
async function resolveSlug(requestedSlug: string | undefined, sanitizedFilename: string): Promise<string> {
  if (requestedSlug && requestedSlug.trim()) {
    const candidate = slugify(requestedSlug);
    if (!candidate) throw new MediaValidationError('Slug must contain at least one letter or number');
    const existing = await mediaRepository.findBySlug(candidate);
    if (existing) throw new MediaValidationError(`Slug "${candidate}" is already in use — choose another`);
    return candidate;
  }
  return mediaRepository.resolveUniqueSlug(slugBaseFromFilename(sanitizedFilename));
}

/**
 * Upload flow (see docs/media-module.md#failure-handling for the full rationale):
 * validate -> resolve slug -> generate key -> upload bytes -> insert DB row. If the DB
 * insert fails after the bytes are already written, the just-uploaded object is deleted so
 * it doesn't become a permanent orphan; if *that* cleanup also fails, it's logged with
 * enough context (provider + key) to reconcile manually — this module doesn't build a
 * distributed transaction system for a single best-effort cleanup step.
 */
async function upload(input: UploadMediaInput) {
  const sanitizedFilename = sanitizeFilename(input.originalFileName);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const declaredMimeType = input.file.type || 'application/octet-stream';

  console.log('[media] upload started', { uploadedBy: input.uploadedBy, filename: sanitizedFilename, declaredMimeType, size: buffer.length });

  const validated = validateUpload({ buffer, declaredMimeType, sanitizedFilename });
  const slug = await resolveSlug(input.requestedSlug, sanitizedFilename);

  const storageKey = generateStorageKey(validated.extension);
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const provider = getStorageProvider();

  await provider.upload({ key: storageKey, body: buffer, contentType: validated.mimeType });

  try {
    const record = await mediaRepository.create({
      uploadedBy: input.uploadedBy,
      slug,
      originalFileName: sanitizedFilename,
      storageKey,
      mimeType: validated.mimeType,
      extension: validated.extension,
      size: buffer.length,
      storageProvider: PROVIDER_VALUE,
      checksum,
    });
    console.log('[media] upload succeeded', { mediaId: record!.id, slug, uploadedBy: input.uploadedBy, provider: PROVIDER_VALUE, storageKey, size: buffer.length });
    return record!;
  } catch (err) {
    console.error('[media] DB insert failed after storage upload — attempting cleanup', {
      uploadedBy: input.uploadedBy,
      slug,
      provider: PROVIDER_VALUE,
      storageKey,
      error: err instanceof Error ? err.message : err,
    });
    try {
      await provider.delete(storageKey);
      console.log('[media] cleanup of orphaned upload succeeded', { storageKey, provider: PROVIDER_VALUE });
    } catch (cleanupErr) {
      console.error('[media] ORPHANED STORAGE OBJECT — cleanup failed, needs manual reconciliation', {
        storageKey,
        provider: PROVIDER_VALUE,
        error: cleanupErr instanceof Error ? cleanupErr.message : cleanupErr,
      });
    }
    // A slug race lost between the availability check above and this insert (two
    // concurrent uploads requesting the same custom slug) surfaces as a duplicate-key
    // error on media_slug_idx — worth a clear, retryable message rather than a generic 500.
    if (isDuplicateKeyError(err)) {
      throw new MediaValidationError(`Slug "${slug}" is already in use — choose another`);
    }
    throw err;
  }
}

async function getMetadata(slug: string, viewer: Viewer) {
  const row = await mediaRepository.findBySlug(slug);
  if (!row) throw new MediaNotFoundError();
  if (!canView(row, viewer)) throw new MediaAuthorizationError();
  return row;
}

export type MediaContent =
  | { kind: 'redirect'; url: string; filename: string }
  | { kind: 'stream'; stream: ReadableStream<Uint8Array>; contentType: string; contentLength: number; filename: string };

/**
 * Serving strategy lives entirely behind FileStorageProvider: if the active provider can
 * hand back a direct URL (a signed S3/R2 URL, a public CDN URL), that's preferred and the
 * route redirects; LocalFileStorageProvider never can, so this always falls back to
 * streaming through the app server for local disk. Callers (the /content route) don't
 * need to know which case they're in.
 */
async function getContent(slug: string, viewer: Viewer): Promise<MediaContent> {
  const row = await mediaRepository.findBySlug(slug);
  if (!row) throw new MediaNotFoundError();
  if (!canView(row, viewer)) throw new MediaAuthorizationError();

  const provider = getStorageProvider();

  const accessUrl = await provider.getAccessUrl?.(row.storageKey);
  if (accessUrl) return { kind: 'redirect', url: accessUrl, filename: row.originalFileName };

  const result = await provider.get(row.storageKey);
  return { kind: 'stream', stream: result.stream, contentType: row.mimeType, contentLength: result.contentLength, filename: row.originalFileName };
}

/**
 * Delete consistency strategy: the DB row is deleted first, then the storage object.
 * Deleting the DB row is what actually revokes access (once it's gone, getMetadata/
 * getContent 404 for everyone) — that's the user-visible contract of "delete," and it's
 * atomic (a single DB statement). If the subsequent storage delete fails, the result is a
 * harmless orphaned object with no way to reach it through the app, logged here for a
 * future reconciliation sweep. The alternative order (storage first, DB second) risks the
 * opposite failure — a DB row that still "exists" but 404s when opened — which is a worse
 * user-facing bug than a few extra bytes on disk.
 */
async function remove(slug: string, actor: { userId: string; role: UserRole }) {
  const row = await mediaRepository.findBySlug(slug);
  if (!row) throw new MediaNotFoundError();
  if (!canDelete(row, actor)) throw new MediaAuthorizationError();

  console.log('[media] delete started', { mediaId: row.id, slug, actorId: actor.userId, provider: row.storageProvider, storageKey: row.storageKey });

  await mediaRepository.deleteById(row.id);

  try {
    await getStorageProvider().delete(row.storageKey);
    console.log('[media] delete succeeded', { mediaId: row.id, slug, actorId: actor.userId, storageKey: row.storageKey });
  } catch (err) {
    console.error('[media] storage delete failed after DB row removed — orphaned object needs reconciliation', {
      mediaId: row.id,
      slug,
      provider: row.storageProvider,
      storageKey: row.storageKey,
      error: err instanceof Error ? err.message : err,
    });
  }
}

async function listMine(userId: string, page: number, limit: number) {
  return mediaRepository.listByUser(userId, { page, limit });
}

export const mediaService = {
  upload,
  getMetadata,
  getContent,
  remove,
  listMine,
};
