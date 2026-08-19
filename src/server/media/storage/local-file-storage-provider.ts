import { mkdir, writeFile, unlink, access, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import type { FileStorageProvider, StorageUploadInput, StorageUploadResult, StorageReadResult } from './types';
import { StorageObjectNotFoundError } from './types';

/**
 * Stores bytes under `root/<key>` on the local filesystem. `key` is always a
 * server-generated value (see key-generator.ts) — this provider never sees a
 * user-supplied filename — but it still re-validates that the resolved path stays inside
 * `root` before touching disk, as defense in depth against a future caller passing an
 * untrusted key.
 */
export class LocalFileStorageProvider implements FileStorageProvider {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(process.cwd(), root);
  }

  private resolvePath(key: string): string {
    const resolved = path.resolve(this.root, key);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new Error(`Refusing to access storage key outside root: ${key}`);
    }
    return resolved;
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const fullPath = this.resolvePath(input.key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.body);
    return { key: input.key, size: input.body.length };
  }

  async get(key: string): Promise<StorageReadResult> {
    const fullPath = this.resolvePath(key);
    let fileStat;
    try {
      fileStat = await stat(fullPath);
    } catch {
      throw new StorageObjectNotFoundError(key);
    }
    const nodeStream = createReadStream(fullPath);
    return {
      stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
      // Local storage doesn't persist content-type itself — the DB row is the source of
      // truth for that, so callers (media.service.ts) overwrite this before responding.
      contentType: 'application/octet-stream',
      contentLength: fileStat.size,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolvePath(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  // No direct URL for local disk — /content always streams through the app server.
  async getAccessUrl(): Promise<string | null> {
    return null;
  }
}
