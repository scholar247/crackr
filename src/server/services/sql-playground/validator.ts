import { SQL_MAX_LENGTH } from '@/lib/sql-playground/templates';

export class SQLValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SQLValidationError';
  }
}

// Every query runs against a throwaway in-memory database, so ordinary DDL/DML is safe.
// These are blocked because they reach outside that database: ATTACH/VACUUM INTO can
// create files on the server's disk, load_extension loads native code, and the heap-limit
// pragmas would lift the memory cap the executor sets.
//
// Matched as whole words on the raw text (not a substring check, which used to reject
// harmless names like an `attachments` table). A blocked word inside a string literal is
// still rejected — a rare false positive, but it keeps this check impossible to dodge by
// confusing a tokenizer.
const BLOCKED: { pattern: RegExp; label: string }[] = [
  { pattern: /\bATTACH\b/i, label: 'ATTACH' },
  { pattern: /\bDETACH\b/i, label: 'DETACH' },
  { pattern: /\bVACUUM\b/i, label: 'VACUUM' },
  { pattern: /\bLOAD_EXTENSION\b/i, label: 'load_extension' },
  { pattern: /\b(HARD|SOFT)_HEAP_LIMIT\b/i, label: 'Heap limit pragmas' },
];

export function validateSQL(sql: string) {
  if (!sql.trim()) throw new SQLValidationError('SQL cannot be empty.');

  if (sql.length > SQL_MAX_LENGTH) {
    throw new SQLValidationError(`SQL is too long (max ${SQL_MAX_LENGTH.toLocaleString()} characters).`);
  }

  for (const { pattern, label } of BLOCKED) {
    if (pattern.test(sql)) throw new SQLValidationError(`${label} is not allowed in the playground.`);
  }
}
