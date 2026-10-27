import { eq, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/server/db/client';
import { media, type MediaStorageProviderValue } from '@/server/db/schema/media';

export interface CreateMediaInput {
  uploadedBy: string;
  slug: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  extension: string | null;
  size: number;
  storageProvider: MediaStorageProviderValue;
  checksum: string | null;
}

async function create(input: CreateMediaInput) {
  const id = randomUUID();
  await db.insert(media).values({ id, ...input });
  return findById(id);
}

async function findById(id: string) {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

async function findBySlug(slug: string) {
  const [row] = await db.select().from(media).where(eq(media.slug, slug)).limit(1);
  return row ?? null;
}

async function deleteById(id: string) {
  await db.delete(media).where(eq(media.id, id));
}

// Auto-derived slugs (no name the caller picked themselves) get silently suffixed on
// collision — same tradeoff and same accepted check-then-insert race as
// community.repository.ts's ensureUniqueSlug (no realistic concurrent-upload race at this
// product's scale). A caller-supplied slug is handled differently, in
// media.service.ts#upload — collisions there are surfaced as a rejection instead, since
// silently changing a name the user typed themselves would be surprising.
async function resolveUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await findBySlug(candidate);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

async function listByUser(uploadedBy: string, { page, limit }: { page: number; limit: number }) {
  const offset = (page - 1) * limit;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(media).where(eq(media.uploadedBy, uploadedBy)).orderBy(desc(media.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(media).where(eq(media.uploadedBy, uploadedBy)),
  ]);
  return { rows, total: Number(count) };
}

export const mediaRepository = {
  create,
  findById,
  findBySlug,
  deleteById,
  listByUser,
  resolveUniqueSlug,
};
