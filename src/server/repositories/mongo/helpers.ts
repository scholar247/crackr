import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

/** Convert MongoDB doc (_id) to our shape (id as string) */
export function fromMongo<T extends { _id?: unknown; id?: string }>(
  doc: T
): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  const id = (rest.id as string | undefined) ?? String(_id);
  const result = { ...rest, id } as Omit<T, '_id'> & { id: string };

  // Convert Date objects to ISO strings (top-level only)
  const res = result as Record<string, unknown>;
  for (const key of Object.keys(res)) {
    const val = res[key];
    if (val !== null && typeof val === 'object' && val instanceof Date) {
      res[key] = (val as Date).toISOString();
    }
  }

  return result;
}

/** Now = ISO string (used when serverTimestamp equivalent is needed) */
export function nowIso(): string {
  return new Date().toISOString();
}
