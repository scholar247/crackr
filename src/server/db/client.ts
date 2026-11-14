import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

function createDb() {
  return drizzle(connectionString!, { schema, mode: 'default' });
}

// `next dev` re-evaluates this module on every hot reload. Without this, each reload
// opened a fresh mysql2 pool (up to 10 connections that are never released) and leaked
// the old one, until MySQL hit max_connections and every query failed with "Too many
// connections". Keeping one instance on globalThis makes reloads reuse the same pool.
// Production evaluates the module once, so it doesn't need (or use) the global.
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> };

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
