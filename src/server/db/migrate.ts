import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

// Pure function — safe to import from both the CLI runner (scripts/run-migrations.ts)
// and src/instrumentation.ts (runs on server startup so tables get created automatically
// if they don't exist yet; migration SQL files under drizzle/ remain the source of truth
// for future schema changes — this just applies whatever hasn't been applied yet).
export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const connection = await mysql.createConnection(connectionString);
  const db = drizzle(connection, { mode: 'default' });

  await migrate(db, { migrationsFolder: './drizzle' });
  await connection.end();
}
