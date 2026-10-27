// Single source of truth for every media-module env var — nothing outside this file
// should read `process.env.MEDIA_*` / `process.env.AWS_*` directly (mirrors the
// single-chokepoint convention already used for auth in server/auth/require-auth.ts).

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Deliberately conservative — executable/script-like and markup (SVG, HTML) types are
// left out by default since they're either dangerous to serve inline or not something
// this product needs yet. Override via MEDIA_ALLOWED_MIME_TYPES for other use cases
// (e.g. profile photos vs. resumes vs. course resources may want different allowlists
// per call site later — see docs/media-module.md).
const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

export type MediaStorageProvider = 'local' | 's3';

function parseStorageProvider(raw: string | undefined): MediaStorageProvider {
  if (raw === 's3') return 's3';
  if (raw === 'local' || raw === undefined || raw === '') return 'local';
  throw new Error(`Unsupported MEDIA_STORAGE_PROVIDER: "${raw}" (expected "local" or "s3")`);
}

function parseAllowedMimeTypes(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_ALLOWED_MIME_TYPES;
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  // An explicit "*" opts out of the allowlist entirely — "do not unnecessarily restrict
  // file types" per the module's design goals, for deployments that want that.
  return parsed.includes('*') ? [] : parsed;
}

export const mediaConfig = {
  storageProvider: parseStorageProvider(process.env.MEDIA_STORAGE_PROVIDER),
  // Resolved relative to process.cwd() (the project root at runtime for `next dev`/`next
  // start`), never hard-coded — matches the ticket's "configurable, not a
  // developer-specific path" requirement while still working out of the box. Storage
  // *keys* already start with "media/" (see key-generator.ts), so this root deliberately
  // does not also include "media" — otherwise local paths would double up as
  // ".../storage/media/media/...". The two compose to "./storage/media/<yyyy>/...".
  storageRoot: process.env.MEDIA_STORAGE_ROOT || './storage',
  maxFileSize: Number(process.env.MEDIA_MAX_FILE_SIZE) > 0 ? Number(process.env.MEDIA_MAX_FILE_SIZE) : DEFAULT_MAX_FILE_SIZE,
  // Default-private: GET /content and /:id require the caller to own the media (or be
  // admin) unless a deployment opts into public reads. See docs/media-module.md.
  publicAccess: process.env.MEDIA_PUBLIC_ACCESS === 'true',
  allowedMimeTypes: parseAllowedMimeTypes(process.env.MEDIA_ALLOWED_MIME_TYPES),
  // Not wired to a real client yet (no AWS SDK in this codebase) — present so
  // StorageProviderFactory and S3FileStorageProvider have somewhere to read config from
  // the moment the SDK is added. See src/server/media/storage/s3-file-storage-provider.ts.
  s3: {
    bucket: process.env.MEDIA_S3_BUCKET || process.env.AWS_BUCKET_NAME || '',
    region: process.env.MEDIA_S3_REGION || process.env.AWS_REGION || '',
    accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
    // Set for S3-compatible providers other than AWS (Cloudflare R2, MinIO, etc.); leave
    // unset for real AWS S3.
    endpoint: process.env.MEDIA_S3_ENDPOINT || '',
  },
} as const;
