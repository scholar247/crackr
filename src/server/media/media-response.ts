import type { media } from '@/server/db/schema/media';

type MediaRow = typeof media.$inferSelect;

/**
 * The only shape the API ever hands back — deliberately excludes storageKey,
 * storageProvider, uploadedBy, and checksum, none of which a consumer needs and some of
 * which (storageKey) would leak internal layout if echoed back. `url` is always the
 * app-stable `/api/v1/media/{slug}/content` route, never a provider-specific path, so it
 * stays correct across a local -> S3 migration with zero client changes. `slug`, not the
 * internal `id`, is also what every route (GET metadata, GET content, DELETE) is keyed by
 * — see media.service.ts.
 */
export function toMediaResponse(row: MediaRow) {
  return {
    id: row.id,
    slug: row.slug,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    extension: row.extension,
    size: row.size,
    url: `/api/v1/media/${row.slug}/content`,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
