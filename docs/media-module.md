# Media / File Storage Module

Generic, reusable file-upload infrastructure. Any feature (resumes, course resources,
profile photos, community/assessment attachments, ...) uploads through the same API and
gets back a stable `/api/v1/media/{slug}/content` URL — no feature talks to the filesystem,
`fs`, or a cloud SDK directly.

## Architecture

```
API route handlers (src/app/api/v1/media/**)
        ↓
media.service.ts        (validation, orchestration, authorization policy)
        ↓
media.repository.ts     (DB metadata — the `media` table)
        ↓
FileStorageProvider      (the ONLY interface business logic depends on)
        ↓
LocalFileStorageProvider  |  S3FileStorageProvider (interface-ready stub)
```

- **The DB row is the source of truth for existence and access control.** The storage
  provider only knows raw bytes at a `storageKey` — it never decides who can see what.
- **The binary is never stored in the database** — only metadata (`src/server/db/schema/media.ts`).
- **`storageKey` (e.g. `media/2026/08/19/<uuid>.pdf`), not a URL, is the canonical identity**
  of the bytes. Consumers never see it — they get `url: "/api/v1/media/{slug}/content"`,
  which stays correct regardless of which provider is active.
- **`slug`, not the internal UUID `id`, is what every route is keyed by.** `id` remains the
  immutable primary key (what a future FK from another table would reference); `slug` is
  the human-readable, URL-facing identifier — auto-derived from the filename or chosen by
  the uploader, see "Slugs" below.

### Files

```
src/lib/media-config.ts                          single source of truth for all MEDIA_*/AWS_* env vars

src/server/db/schema/media.ts                     the `media` table

src/server/media/
  key-generator.ts                                generateStorageKey() — date-bucketed, collision-proof
  validators.ts                                    sanitizeFilename, mime allowlist, magic-byte sniff, size/empty checks
  content-disposition.ts                           builds a Latin1-safe Content-Disposition header for any filename
  media.service.ts                                 upload/getMetadata/getContent/remove/listMine + authorization + slug policy
  media-response.ts                                DB row -> public API shape (never leaks storageKey/provider)
  storage/
    types.ts                                       FileStorageProvider interface (the abstraction)
    local-file-storage-provider.ts                 disk implementation
    s3-file-storage-provider.ts                    interface-ready stub, not wired to a real client
    storage-provider-factory.ts                    the one place MEDIA_STORAGE_PROVIDER is switched on

src/server/repositories/media.repository.ts        DB CRUD, matches this repo's existing repository convention

src/app/api/v1/media/
  route.ts                                         POST   upload
  my/route.ts                                       GET    paginated "my media"
  [slug]/route.ts                                   GET    metadata, DELETE
  [slug]/content/route.ts                           GET    stream/redirect the bytes

src/components/media/media-library.tsx              generic "My Media" UI (upload/list/delete), reusable by any feature
src/app/(app)/media/page.tsx                         thin server page wiring MediaLibrary into the app shell
```

## The abstraction

```ts
interface FileStorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  get(key: string): Promise<StorageReadResult>;      // stream + contentLength, for backend streaming
  delete(key: string): Promise<void>;                 // idempotent — deleting a missing key is not an error
  exists(key: string): Promise<boolean>;
  getAccessUrl?(key: string, opts?: { expiresInSeconds?: number }): Promise<string | null>;
}
```

`getAccessUrl` is the seam that lets serving strategy vary by provider without touching
the `/content` route: `LocalFileStorageProvider` always returns `null` (no direct URL for
local disk exists), so the route streams through `get()`. A provider that *can* hand back
a signed/public URL (S3, R2, GCS) returns one, and the route 302-redirects instead — same
code path either way (`media.service.ts#getContent`).

## Slugs

Every media row has a unique `slug` (`media_slug_idx`), resolved server-side at upload
time (`media.service.ts#resolveSlug`) before any bytes are written to storage:

- **No `slug` field in the upload request** (the common case): derived from the filename
  (`slugBaseFromFilename` — strips the extension, runs it through the existing
  `slugify()` from `lib/utils.ts`, falls back to `"file"` if that's empty). If the result
  collides with an existing slug, it's silently suffixed (`my-notes`, `my-notes-2`,
  `my-notes-3`, ...) via `mediaRepository.resolveUniqueSlug` — the same check-then-insert
  pattern `community.repository.ts#ensureUniqueSlug` already uses, and the same accepted
  race tolerance (no realistic concurrent-upload collision at this product's scale).
- **A `slug` field supplied in the upload request**: treated as an intentional choice.
  It's slugified, checked for availability, and the upload is **rejected with 400 before
  any storage write happens** if it's already taken — never silently renamed. A race lost
  between that check and the DB insert (two concurrent uploads requesting the same custom
  slug) is caught via `isDuplicateKeyError` on the unique index and surfaced as the same
  clear "already in use" error rather than a generic 500.

The "My Media" UI (`media-library.tsx`) exposes this as an optional "Custom URL slug"
input next to the upload button; leaving it blank auto-derives from the filename.

## Environment variables

```env
MEDIA_STORAGE_PROVIDER=local        # "local" | "s3"
MEDIA_STORAGE_ROOT=./storage        # local only — resolved against process.cwd()
MEDIA_MAX_FILE_SIZE=5242880         # bytes, default 5 MB
MEDIA_PUBLIC_ACCESS=true            # true = GET metadata/content is public; false = owner/admin only
MEDIA_ALLOWED_MIME_TYPES=image/jpeg,image/png,...   # comma-separated; "*" disables the allowlist; unset = built-in default list

# S3/R2 (only read once MEDIA_STORAGE_PROVIDER=s3; also accepts the pre-existing
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION / AWS_BUCKET_NAME as fallbacks)
MEDIA_S3_BUCKET=
MEDIA_S3_REGION=
MEDIA_S3_ACCESS_KEY_ID=
MEDIA_S3_SECRET_ACCESS_KEY=
MEDIA_S3_ENDPOINT=                  # only for R2/MinIO/other S3-compatible endpoints
```

Local storage key layout: `{MEDIA_STORAGE_ROOT}/media/{yyyy}/{mm}/{dd}/{uuid}.{ext}` — date
bucketing keeps any one directory from accumulating unbounded files; the UUID (never the
original filename) makes every key collision-proof.

## API

All routes are under `/api/v1/media` (this repo's existing `/api/v1/*` convention — the
ticket's literal `/api/media` paths were adapted to match).

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/media` | required | multipart `file` field (≤5 MB) + optional `slug` field |
| GET | `/api/v1/media/my?page=&pageSize=` | required | always scoped to the caller; also accepts `limit` as an alias for `pageSize` |
| GET | `/api/v1/media/:slug` | owner/admin, or public if `MEDIA_PUBLIC_ACCESS=true` | metadata only |
| GET | `/api/v1/media/:slug/content` | same as above | streams bytes (or redirects, see above) |
| DELETE | `/api/v1/media/:slug` | owner/admin | see delete consistency below |

Pagination response shape matches the existing convention used by
`/api/v1/admin/questions` and `/api/v1/admin/blog`:
`apiSuccess(rows, { total, page, limit, totalPages })`.

Upload response:

```json
{
  "data": {
    "id": "...",
    "slug": "resume",
    "originalFileName": "resume.pdf",
    "mimeType": "application/pdf",
    "extension": "pdf",
    "size": 234567,
    "url": "/api/v1/media/resume/content",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

`storageKey`, `storageProvider`, `uploadedBy`, and `checksum` are intentionally never
returned by the API (`media-response.ts`) — internal details, not needed by any consumer.

## Validation

- **Size**: rejected server-side (`validators.ts#validateUpload`) against
  `MEDIA_MAX_FILE_SIZE`, regardless of what the client sends. The upload route also does a
  cheap early `Content-Length`-based rejection before buffering the multipart body.
- **Empty files**: rejected (0 bytes).
- **Filename**: sanitized (`sanitizeFilename`) for storage as metadata — it is *never*
  used to build a filesystem path. The storage key is always a server-generated UUID
  (`key-generator.ts`). Separately, `content-disposition.ts#buildContentDisposition`
  handles the `/content` route's `Content-Disposition` header: `Response`/`Headers`
  values must be valid ByteStrings (Latin1 only), so an `originalFileName` containing any
  character above code point 255 (accented letters, CJK, typographic punctuation like
  U+2019/U+202F, emoji, ...) would otherwise throw a hard `TypeError` on that route —
  sanitizing control characters isn't enough to prevent that. The fix emits both an
  ASCII-safe `filename=` fallback and an RFC 5987 `filename*=UTF-8''...` extended form, so
  modern browsers still show the real name.
- **MIME type**: the *declared* `Content-Type` is checked against `MEDIA_ALLOWED_MIME_TYPES`.
  Additionally, the first bytes of the file are sniffed against a small magic-byte table
  (`sniffMimeType`) covering PNG/JPEG/GIF/WEBP/PDF/ZIP-container/OLE-container — if the
  sniffed signature actively disagrees with the declared type (e.g. declaring
  `image/png` but uploading a JPEG), the upload is rejected as spoofed. Formats without a
  reliable signature (e.g. `text/plain`) fall back to trusting the declared type once
  it's passed the allowlist check. `sniffMimeType` is a single, swappable function —
  replacing it with the `file-type` npm package later needs no other code changes.

## Failure handling

**Upload**: bytes are written to the storage provider *before* the DB row is inserted. If
the DB insert then fails, the just-written object is deleted; if that cleanup also fails,
it's logged (`[media] ORPHANED STORAGE OBJECT`) with the provider + key for manual
reconciliation. No distributed-transaction machinery — a single best-effort cleanup step.

**Delete**: the DB row is deleted *first*, then the storage object. Deleting the DB row is
what actually revokes access (once it's gone, every route 404s for everyone) — that's the
user-visible contract of "delete," and it's a single atomic statement. If the follow-up
storage delete fails, the result is a harmless orphaned object with no way to reach it
through the app (logged as `[media] storage delete failed after DB row removed`), rather
than the opposite failure mode (a DB row that "exists" but 404s when opened), which would
be a more confusing bug to hit as a user.

## Authorization

- Upload: any authenticated user (this is shared infrastructure, not gated by role).
- Metadata / content GET: owner or admin, unless `MEDIA_PUBLIC_ACCESS=true`.
- Delete: owner or admin, always — never affected by `MEDIA_PUBLIC_ACCESS`.
- Enforced entirely server-side in `media.service.ts` (`canView`/`canDelete`), independent
  of any frontend — matches this repo's `requireAuth`/`optionalAuth` convention.

**`MEDIA_PUBLIC_ACCESS=true` is the current setting in both `.env.development` and
`.env.production`.** This is deliberately all-or-nothing — there's no per-item
public/private flag yet — and was chosen because `thumbnailUrl` fields on
programs/exams/curriculum nodes (see `docs/`... the taxonomy schema) point admins at
`/api/v1/media/{slug}/content` URLs that need to load on public, unauthenticated marketing
pages (`/exams`). The tradeoff: every file uploaded through this module is readable by
anyone with its URL, not just the uploader. Don't use "My Media" for anything sensitive
(resumes, personal documents) while this flag is on — if that need comes up, the proper
fix is a per-item `isPublic` column checked alongside this global flag in
`media.service.ts#canView`, not flipping this back to `false`, which would break every
thumbnail already in use.

## Adding a real S3/R2 provider later

1. `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`.
2. Finish `src/server/media/storage/s3-file-storage-provider.ts` — the class doc comment
   there has the exact method-by-method mapping to AWS SDK v3 calls.
3. Set `MEDIA_STORAGE_PROVIDER=s3` and the `MEDIA_S3_*` env vars.

Nothing else changes: `media.service.ts`, the DB schema, every API route, the "My Media"
UI, and any future feature that calls `mediaService.upload(...)` are all provider-agnostic
by construction.

## Verification

This codebase has no test framework installed (no `vitest`/`jest`/test files exist
anywhere in the repo today) — the established convention for this project, used
throughout its recent feature work, is live verification against the dev server with
minted session cookies rather than a new test-runner dependency. The module was verified
this way end-to-end: unauthenticated upload rejected, valid upload accepted, empty/oversized/
disallowed-type/spoofed-type uploads all rejected, path-traversal filename neutralized,
metadata/content access enforced per-owner (403 for another user, 401/403 anonymous),
pagination (`page`/`pageSize`) with correct `total`/`totalPages` and newest-first
ordering, a second user's listing never includes the first user's files, delete removes
both the DB row and the on-disk object (subsequent GETs 404), slug auto-derivation +
collision suffixing, custom-slug availability rejection (including the DB-level race), and
— against the exact row that originally triggered the Unicode-filename crash report — a
200 with a correctly encoded `Content-Disposition` header instead of a 500. See the git
history for the (deleted, scratch-only) verification scripts if you want to reconstruct
them.
