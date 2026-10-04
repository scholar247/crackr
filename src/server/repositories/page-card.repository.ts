import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { pageCards } from '@/server/db/schema';

export type PageCard = typeof pageCards.$inferSelect;
export type PageCardInput = Omit<typeof pageCards.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;

// Public read: active cards only, in display order.
async function listActive(page: string, section: string) {
  return db
    .select()
    .from(pageCards)
    .where(and(eq(pageCards.page, page), eq(pageCards.section, section), eq(pageCards.isActive, true)))
    .orderBy(asc(pageCards.sequence), asc(pageCards.createdAt));
}

async function listAll() {
  return db.select().from(pageCards).orderBy(asc(pageCards.page), asc(pageCards.section), asc(pageCards.sequence));
}

async function findById(id: string) {
  const [row] = await db.select().from(pageCards).where(eq(pageCards.id, id)).limit(1);
  return row ?? null;
}

async function create(input: PageCardInput) {
  const id = crypto.randomUUID();
  await db.insert(pageCards).values({ ...input, id });
  return findById(id);
}

async function update(id: string, input: Partial<PageCardInput>) {
  await db
    .update(pageCards)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(pageCards.id, id));
  return findById(id);
}

async function remove(id: string) {
  await db.delete(pageCards).where(eq(pageCards.id, id));
}

export const pageCardRepository = { listActive, listAll, findById, create, update, remove };
