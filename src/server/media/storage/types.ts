// The one interface the rest of the application is allowed to depend on for file bytes.
// media.service.ts (and, transitively, every API route) talks only to this — never to
// `fs`, a cloud SDK, or a provider class directly. Swapping MEDIA_STORAGE_PROVIDER from
// "local" to "s3" means writing/finishing a provider that satisfies this interface; it
// does not touch the service, the DB schema, or any API route.

export interface StorageUploadInput {
  /** Pre-generated, collision-free key (see key-generator.ts) — never the original filename. */
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageUploadResult {
  key: string;
  size: number;
}

export interface StorageReadResult {
  /** Web Streams API so route handlers can hand it straight to `new Response(stream, ...)`. */
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number;
}

export interface FileStorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  /** Throws StorageObjectNotFoundError if `key` doesn't exist. */
  get(key: string): Promise<StorageReadResult>;
  /** Idempotent — deleting an already-absent key is not an error. */
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /**
   * Optional alternate serving strategy for providers that can hand back a URL instead of
   * bytes (a signed S3/R2 URL, a public CDN URL). Return `null` to mean "no such shortcut
   * — the caller should stream via get() instead," which is what LocalFileStorageProvider
   * always does. The /content route checks this first and falls back to streaming, so
   * adding a provider that *can* redirect/sign never requires touching that route.
   */
  getAccessUrl?(key: string, opts?: { expiresInSeconds?: number }): Promise<string | null>;
}

export class StorageObjectNotFoundError extends Error {
  constructor(public readonly key: string) {
    super(`Storage object not found: ${key}`);
    this.name = 'StorageObjectNotFoundError';
  }
}
