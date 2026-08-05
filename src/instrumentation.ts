// Runs once when a new server instance starts, before it accepts requests. Applies any
// pending Drizzle migrations (idempotent — tracked in the `__drizzle_migrations` table,
// so this safely no-ops once the schema is already up to date), which is what creates the
// tables on a fresh/empty database automatically. drizzle/*.sql remains the source of
// truth for schema changes going forward — `npm run db:generate` after editing a schema
// file adds a new migration, and this hook picks it up on the next server start (or run
// `npm run db:migrate` directly to apply it immediately).
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { runMigrations } = await import('@/server/db/migrate');
  try {
    await runMigrations();
    console.log('[db] migrations up to date');
  } catch (err) {
    console.error('[db] failed to apply migrations on startup:', err instanceof Error ? err.message : err);
  }
}
