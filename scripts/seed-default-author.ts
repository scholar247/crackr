/**
 * Seeds the fallback "Scholar" author row that service-key/seed-script content writes
 * attribute to (see DEFAULT_CONTENT_AUTHOR_ID in src/server/auth/require-auth.ts). Keyed
 * by a fixed id rather than email/slug, since the id is what routes reference directly —
 * safe to re-run against any environment, including one where this row already exists.
 *
 * Run: npm run db:seed-author
 */
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';

async function main() {
  const [existing] = await db.select().from(users).where(eq(users.id, DEFAULT_CONTENT_AUTHOR_ID)).limit(1);
  if (existing) {
    console.log(`Default author already exists: ${existing.name} <${existing.email}> (${existing.id})`);
    return;
  }

  await db.insert(users).values({
    id: DEFAULT_CONTENT_AUTHOR_ID,
    name: 'Scholar',
    email: 'scholar@syllabuzai.com',
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  console.log(`Created default author "Scholar" (${DEFAULT_CONTENT_AUTHOR_ID})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
