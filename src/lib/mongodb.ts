import { MongoClient, type Db } from 'mongodb';

const uri    = process.env.MONGODB_URI ?? '';
const dbName = process.env.MONGODB_DB  ?? 'scholar247';

if (!uri) throw new Error('MONGODB_URI is not set');

const OPTIONS = {
  maxPoolSize:               10,
  minPoolSize:               2,         // keep at least 2 connections warm
  serverSelectionTimeoutMS:  10_000,
  socketTimeoutMS:           45_000,
  connectTimeoutMS:          10_000,
  maxIdleTimeMS:             60_000,    // recycle idle sockets before server kills them
  retryReads:                true,
  retryWrites:               true,
};

// ─── Global cache ─────────────────────────────────────────────────────────────
// Storing the promise on `global` ensures a single MongoClient per Node.js
// process, surviving Next.js hot-module reloads in development.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  return new MongoClient(uri, OPTIONS).connect();
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV !== 'production') {
  // Dev: reuse across HMR cycles so we don't exhaust connection limits
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Production: module-level singleton (one per worker process)
  clientPromise = createClientPromise();
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getMongoDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
