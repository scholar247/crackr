import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { audiences } from '@/server/db/schema';

// Minimal read surface — audiences (cohorts like "Class 10", an org's student list) are
// mostly populated by future admin/org tooling; this is just enough for the group-test
// wizard's "invite an existing group" picker and its server-side id validation.
async function listActive() {
  return db.select().from(audiences).where(eq(audiences.status, 'ACTIVE')).orderBy(audiences.name);
}

async function findManyActiveByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select().from(audiences).where(and(eq(audiences.status, 'ACTIVE'), inArray(audiences.id, ids)));
}

export const audienceRepository = {
  listActive,
  findManyActiveByIds,
};
