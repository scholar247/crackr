import type { FileStorageProvider, StorageUploadInput, StorageUploadResult, StorageReadResult } from './types';

export interface S3ProviderConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Set for S3-compatible providers other than AWS (Cloudflare R2, MinIO, ...). */
  endpoint?: string;
}

/**
 * Interface-ready placeholder — this codebase has no AWS/S3 SDK dependency yet (see
 * docs/media-module.md's "adding a real S3/R2 provider" section for the exact steps), so
 * this class intentionally does not perform real network calls. It exists to prove the
 * abstraction: StorageProviderFactory can already construct it from
 * `MEDIA_STORAGE_PROVIDER=s3` config, and every method signature matches
 * FileStorageProvider exactly, so finishing this file is the *only* change required to
 * move production traffic off local disk — media.service.ts, the DB schema, and every API
 * route stay untouched.
 *
 * To finish this:
 *   1. `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
 *   2. Construct an S3Client from `this.config` in the constructor.
 *   3. upload() -> PutObjectCommand with Bucket/Key/Body/ContentType.
 *   4. get() -> GetObjectCommand; `res.Body` from the SDK v3 is already a web
 *      ReadableStream in Node 18+ runtimes (`.transformToWebStream()`).
 *   5. delete() -> DeleteObjectCommand (already idempotent — S3 doesn't error on a
 *      missing key, matching this interface's contract).
 *   6. exists() -> HeadObjectCommand, treat a 404/NotFound error as `false`.
 *   7. getAccessUrl() -> getSignedUrl(client, new GetObjectCommand(...), { expiresIn }),
 *      or just return the public bucket/CDN URL if the bucket is public.
 */
export class S3FileStorageProvider implements FileStorageProvider {
  constructor(private readonly config: S3ProviderConfig) {}

  private notImplemented(): never {
    throw new Error(
      `S3FileStorageProvider is not wired to an S3 client yet (bucket="${this.config.bucket}", region="${this.config.region}"). ` +
        'See the class doc comment in src/server/media/storage/s3-file-storage-provider.ts for the steps to finish it.'
    );
  }

  async upload(_input: StorageUploadInput): Promise<StorageUploadResult> {
    this.notImplemented();
  }

  async get(_key: string): Promise<StorageReadResult> {
    this.notImplemented();
  }

  async delete(_key: string): Promise<void> {
    this.notImplemented();
  }

  async exists(_key: string): Promise<boolean> {
    this.notImplemented();
  }

  async getAccessUrl(_key: string, _opts?: { expiresInSeconds?: number }): Promise<string | null> {
    this.notImplemented();
  }
}
