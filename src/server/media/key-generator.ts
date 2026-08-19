import { randomUUID } from 'node:crypto';

/**
 * `media/{yyyy}/{mm}/{dd}/{uuid}.{ext}` — date-bucketed so no single directory ever holds
 * more than a day's uploads, and the UUID (not the original filename) makes every key
 * collision-proof and unguessable. Shared by every storage provider so the on-disk/bucket
 * layout is identical regardless of which one is active.
 */
export function generateStorageKey(extension: string | null): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = extension ? `.${extension}` : '';
  return `media/${yyyy}/${mm}/${dd}/${randomUUID()}${suffix}`;
}
