/**
 * MongoDB-only seeder helpers.
 * Run: npx tsx --env-file=.env.development scripts/seed-all.ts
 */

import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ─── Database abstraction ─────────────────────────────────────────────────────
// DbAdapter is the interface future backends (Postgres, etc.) would implement.

type DocData = Record<string, unknown>;

export interface DbAdapter {
  upsertBySlug(collection: string, slug: string, data: DocData): Promise<string>;
  upsertByField(collection: string, field: string, value: string, data: DocData): Promise<string>;
  upsertByFields(collection: string, fields: Record<string, string>, data: DocData): Promise<string>;
  insert(collection: string, data: DocData): Promise<string>;
  update(collection: string, id: string, data: Partial<DocData>): Promise<void>;
  findByField(collection: string, field: string, value: string): Promise<(DocData & { id: string }) | null>;
  findByFields(collection: string, fields: Record<string, string>): Promise<(DocData & { id: string }) | null>;
  countByField(collection: string, field: string, value: string): Promise<number>;
}

// ─── MongoDB adapter ──────────────────────────────────────────────────────────

async function getMongoAdapter(): Promise<DbAdapter> {
  const { MongoClient } = await import('mongodb');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  const dbName = process.env.MONGODB_DB ?? 'scholar247';

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const withTimestamps = (data: DocData): DocData => ({
    ...data,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return {
    async upsertBySlug(collection, slug, data) {
      const col = db.collection(collection);
      const existing = await col.findOne({ slug });
      if (existing) {
        console.log(`  SKIP  [${slug}]`);
        return existing.id as string;
      }
      const id = generateId();
      await col.insertOne({ id, ...withTimestamps(data) });
      console.log(`  CREATE [${slug}] → ${id}`);
      return id;
    },

    async upsertByField(collection, field, value, data) {
      const col = db.collection(collection);
      const existing = await col.findOne({ [field]: value });
      if (existing) {
        console.log(`  SKIP  [${value}]`);
        return existing.id as string;
      }
      const id = generateId();
      await col.insertOne({ id, ...withTimestamps(data) });
      console.log(`  CREATE [${value}] → ${id}`);
      return id;
    },

    async upsertByFields(collection, fields, data) {
      const col = db.collection(collection);
      const existing = await col.findOne(fields);
      if (existing) {
        console.log(`  SKIP  [${Object.values(fields).join('/')}]`);
        return existing.id as string;
      }
      const id = generateId();
      await col.insertOne({ id, ...data });
      console.log(`  CREATE [${Object.values(fields).join('/')}] → ${id}`);
      return id;
    },

    async insert(collection, data) {
      const col = db.collection(collection);
      const id = generateId();
      await col.insertOne({ id, ...withTimestamps(data) });
      return id;
    },

    async update(collection, id, data) {
      await db.collection(collection).updateOne({ id }, { $set: { ...data, updatedAt: nowIso() } });
    },

    async findByField(collection, field, value) {
      const doc = await db.collection(collection).findOne({ [field]: value });
      if (!doc) return null;
      const { _id, ...rest } = doc;
      return { ...rest, id: (rest.id ?? String(_id)) as string } as DocData & { id: string };
    },

    async findByFields(collection, fields) {
      const doc = await db.collection(collection).findOne(fields);
      if (!doc) return null;
      const { _id, ...rest } = doc;
      return { ...rest, id: (rest.id ?? String(_id)) as string } as DocData & { id: string };
    },

    async countByField(collection, field, value) {
      return db.collection(collection).countDocuments({ [field]: value });
    },
  };
}

// ─── Public factory ───────────────────────────────────────────────────────────

let _adapter: DbAdapter | null = null;

export async function getAdapter(): Promise<DbAdapter> {
  if (_adapter) return _adapter;
  console.log('Using database: mongo\n');
  _adapter = await getMongoAdapter();
  return _adapter;
}
