function hasDupEntryCode(value: unknown): boolean {
  return typeof value === 'object' && value !== null && (value as { code?: string }).code === 'ER_DUP_ENTRY';
}

// Drizzle wraps the raw mysql2 driver error in a DrizzleQueryError — the actual mysql2
// error (with the `code` we care about) lives on `.cause`, not on the top-level error.
export function isDuplicateKeyError(err: unknown): boolean {
  if (hasDupEntryCode(err)) return true;
  const cause = err instanceof Error ? err.cause : undefined;
  return hasDupEntryCode(cause);
}
