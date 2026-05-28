/**
 * Firebase Admin SDK has been removed from this project.
 * All data access now goes through MongoDB via getMongoDb() in lib/mongodb.ts.
 * This stub exists only to surface a clear error if any stale imports remain.
 */
export function getAdminDb(): never {
  throw new Error('Firebase has been removed. Use getMongoDb() from @/lib/mongodb instead.');
}
export function getAdminAuth(): never {
  throw new Error('Firebase has been removed.');
}
export function getAdminStorage(): never {
  throw new Error('Firebase has been removed.');
}
export function serializeDoc<T>(doc: T): T { return doc; }
export function serializeTimestamp(): string { return new Date().toISOString(); }
