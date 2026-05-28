/**
 * Firebase Client SDK has been removed from this project.
 * Authentication is handled by NextAuth (Google OAuth) via next-auth.
 * This stub exists only to surface a clear error if any stale imports remain.
 */
export function getFirebaseApp(): never {
  throw new Error('Firebase has been removed. Use NextAuth for authentication.');
}
export function getFirebaseAuth(): never {
  throw new Error('Firebase has been removed.');
}
export function getFirebaseDb(): never {
  throw new Error('Firebase has been removed.');
}
export function getFirebaseStorage(): never {
  throw new Error('Firebase has been removed.');
}
