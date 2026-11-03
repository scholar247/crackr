import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { SQL_MAX_ROWS, SQL_TIMEOUT_MS } from '@/lib/sql-playground/templates';
import type { SqlExecuteResult, SqlSchemaTable } from '@/lib/sql-playground/types';
import { splitSQLStatements } from './statement-splitter';
import { SQLValidationError, validateSQL } from './validator';

// SQL runs in a small pool of child processes (see sql-runner.cjs for why). A query that
// overruns SQL_TIMEOUT_MS gets its process killed, which is the only reliable way to stop
// a synchronous SQLite call, and a fresh process takes its slot.
const POOL_SIZE = 2;
const MAX_QUEUE = 20;
// The runner is started as its own Node process, never bundled; it ships with the build via
// outputFileTracingIncludes in next.config.ts. (It's spawned rather than fork()ed because
// Turbopack tries to bundle fork()'s script path.)
const RUNNER_PATH = path.join(process.cwd(), 'src', 'server', 'services', 'sql-playground', 'sql-runner.cjs');

type Job =
  | { kind: 'execute'; template: string; statements: string[] }
  | { kind: 'schema'; template: string };

interface Pending {
  job: Job;
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

interface Slot {
  proc: ChildProcess | null;
  current: (Pending & { id: number; timer: NodeJS.Timeout }) | null;
}

export class SqlTimeoutError extends Error {
  constructor() {
    super(`Query took longer than ${SQL_TIMEOUT_MS / 1000}s and was stopped.`);
    this.name = 'SqlTimeoutError';
  }
}

export class SqlBusyError extends Error {
  constructor() {
    super('The SQL playground is busy right now. Please try again in a moment.');
    this.name = 'SqlBusyError';
  }
}

/** A SQLite error caused by the user's SQL (syntax error, missing table …). */
export class SqlQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SqlQueryError';
  }
}

class RunnerPool {
  private slots: Slot[] = Array.from({ length: POOL_SIZE }, () => ({ proc: null, current: null }));
  private queue: Pending[] = [];
  private nextId = 1;

  run<T>(job: Job): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.queue.length >= MAX_QUEUE) return reject(new SqlBusyError());
      this.queue.push({ job, resolve: resolve as (v: unknown) => void, reject });
      this.drain();
    });
  }

  private drain() {
    for (const slot of this.slots) {
      if (slot.current || this.queue.length === 0) continue;
      this.start(slot, this.queue.shift()!);
    }
  }

  private spawn(slot: Slot): ChildProcess {
    const proc = spawn(process.execPath, ['--max-old-space-size=192', RUNNER_PATH], {
      env: { ...process.env, SQL_PLAYGROUND_MAX_ROWS: String(SQL_MAX_ROWS) },
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
      serialization: 'advanced',
    });

    proc.on('message', (msg: { id: number; ok: boolean; value?: unknown; error?: string }) => {
      const current = slot.current;
      if (!current || current.id !== msg.id) return;
      clearTimeout(current.timer);
      slot.current = null;
      if (msg.ok) current.resolve(msg.value);
      else current.reject(new SqlQueryError(msg.error ?? 'Query failed.'));
      this.drain();
    });

    // Crashed (e.g. out of memory) or killed: fail the in-flight job and free the slot so
    // the next job spawns a fresh process.
    proc.on('exit', () => {
      if (slot.proc !== proc) return;
      slot.proc = null;
      const current = slot.current;
      if (current) {
        clearTimeout(current.timer);
        slot.current = null;
        current.reject(new SqlQueryError('The query used too much memory and was stopped.'));
      }
      this.drain();
    });

    proc.on('error', () => proc.kill('SIGKILL'));
    return proc;
  }

  private start(slot: Slot, pending: Pending) {
    const proc = slot.proc ?? (slot.proc = this.spawn(slot));
    const id = this.nextId++;

    const timer = setTimeout(() => {
      if (slot.current?.id !== id) return;
      slot.current = null;
      slot.proc = null;
      proc.kill('SIGKILL');
      pending.reject(new SqlTimeoutError());
      this.drain();
    }, SQL_TIMEOUT_MS);

    slot.current = { ...pending, id, timer };
    proc.send({ id, ...pending.job });
  }
}

// One pool per server process; kept on globalThis so dev-mode hot reloads don't leak pools.
const globalForPool = globalThis as unknown as { sqlRunnerPool?: RunnerPool };
const pool = (globalForPool.sqlRunnerPool ??= new RunnerPool());

export async function executeSQL(template: string, sql: string): Promise<SqlExecuteResult> {
  validateSQL(sql);
  const statements = splitSQLStatements(sql);
  if (statements.length === 0) throw new SQLValidationError('Nothing to run — the editor only contains comments.');

  const started = performance.now();
  const result = await pool.run<Omit<SqlExecuteResult, 'executionTimeMs'>>({ kind: 'execute', template, statements });
  return { ...result, executionTimeMs: Math.round(performance.now() - started) };
}

// Templates never change while the server runs, so each schema is computed once.
const schemaCache = new Map<string, Promise<SqlSchemaTable[]>>();

export function getTemplateSchema(template: string): Promise<SqlSchemaTable[]> {
  let cached = schemaCache.get(template);
  if (!cached) {
    cached = pool.run<SqlSchemaTable[]>({ kind: 'schema', template });
    cached.catch(() => schemaCache.delete(template));
    schemaCache.set(template, cached);
  }
  return cached;
}
