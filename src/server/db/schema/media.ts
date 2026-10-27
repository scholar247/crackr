import { mysqlTable, mysqlEnum, varchar, int, timestamp, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';

// Backs the generic media/file storage module — see src/server/media/media.service.ts.
// One row per uploaded object; the row is the sole source of truth for "does this media
// exist and who can see it," the storage provider (local disk today, S3/R2 later) only
// knows raw bytes at `storageKey`. Never store the binary here.

export const MEDIA_STORAGE_PROVIDERS = ['LOCAL', 'S3'] as const;
export type MediaStorageProviderValue = (typeof MEDIA_STORAGE_PROVIDERS)[number];

export const media = mysqlTable(
  'media',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    uploadedBy: varchar('uploaded_by', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // The public identifier used in URLs (/api/v1/media/{slug}/...) instead of `id` —
    // human-readable, derived from the original filename (or a caller-supplied name) at
    // upload time via media.repository.ts#resolveUniqueSlug, same pattern as
    // communities.slug. `id` stays the immutable PK other tables would FK against.
    slug: varchar('slug', { length: 220 }).notNull(),
    // User-supplied name, sanitized for display/metadata only — never used to build a
    // filesystem/storage path (see server/media/validators.ts#sanitizeFilename).
    originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
    // Provider-internal key, e.g. "media/2026/08/19/<uuid>.pdf" — generated server-side,
    // independent of the original filename (server/media/key-generator.ts). This, not a
    // URL, is the canonical identity of the underlying bytes.
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 127 }).notNull(),
    extension: varchar('extension', { length: 16 }),
    size: int('size').notNull(),
    storageProvider: mysqlEnum('storage_provider', MEDIA_STORAGE_PROVIDERS).notNull(),
    // SHA-256 hex digest (64 chars) — computed at upload time since it's cheap for a
    // 5 MB cap. Not used for dedup/idempotency yet (out of scope per the module's design
    // brief), just there so that can be added later without a schema change.
    checksum: varchar('checksum', { length: 64 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('media_storage_key_idx').on(table.storageKey),
    uniqueIndex('media_slug_idx').on(table.slug),
    // Backs "My Media" (WHERE uploaded_by = ? ORDER BY created_at DESC) — the module's
    // one required query pattern.
    index('media_uploaded_by_created_idx').on(table.uploadedBy, table.createdAt),
  ],
);
