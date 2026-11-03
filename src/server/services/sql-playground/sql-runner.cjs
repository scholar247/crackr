// Child process that actually runs playground SQL (started by executor.ts via fork()).
//
// It lives in its own process because better-sqlite3 is synchronous and cannot be
// interrupted: a runaway query (an endless recursive CTE, a huge cross join) would block
// whichever thread runs it. Here it only blocks this process, which the parent kills on
// timeout and replaces. Plain CommonJS so it runs as-is under `node`, outside the bundler.
'use strict';
/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS by design, see above */

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const TEMPLATE_DIR = path.join(__dirname, 'templates');
const MAX_ROWS = Number(process.env.SQL_PLAYGROUND_MAX_ROWS) || 1000;
const MAX_BLOB_PREVIEW = 64;

// Built template databases, serialized. Opening a copy from a buffer is much faster than
// re-running the template's CREATE/INSERT script on every query.
const templateCache = new Map();

function templateBuffer(id) {
  let buf = templateCache.get(id);
  if (!buf) {
    const script = fs.readFileSync(path.join(TEMPLATE_DIR, `${id}.sql`), 'utf8');
    const db = new Database(':memory:');
    try {
      db.exec(script);
      buf = db.serialize();
    } finally {
      db.close();
    }
    templateCache.set(id, buf);
  }
  return buf;
}

function open(id) {
  const db = new Database(templateBuffer(id));
  db.pragma('foreign_keys = ON');
  db.pragma('trusted_schema = OFF');
  return db;
}

function toCell(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'bigint') return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  if (Buffer.isBuffer(value)) {
    const hex = value.subarray(0, MAX_BLOB_PREVIEW).toString('hex').toUpperCase();
    return `x'${hex}'${value.length > MAX_BLOB_PREVIEW ? '…' : ''}`;
  }
  return String(value);
}

function execute({ template, statements }) {
  const db = open(template);
  try {
    let last = { columns: [], rows: [], isQuery: false, changes: 0, truncated: false };

    for (const sql of statements) {
      const stmt = db.prepare(sql);

      if (stmt.reader) {
        const columns = stmt.columns().map((c) => c.name);
        const rows = [];
        let truncated = false;
        // raw(): rows as arrays, so duplicate column names don't overwrite each other.
        // iterate(): stop reading at MAX_ROWS instead of materializing everything.
        for (const row of stmt.raw(true).iterate()) {
          if (rows.length >= MAX_ROWS) {
            truncated = true;
            break;
          }
          rows.push(row.map(toCell));
        }
        last = { columns, rows, isQuery: true, changes: 0, truncated };
      } else {
        const info = stmt.run();
        last = { columns: [], rows: [], isQuery: false, changes: info.changes, truncated: false };
      }
    }

    return { ...last, statementCount: statements.length };
  } finally {
    db.close();
  }
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function schema({ template }) {
  const db = open(template);
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name COLLATE NOCASE")
      .pluck()
      .all();

    return tables.map((name) => {
      const fks = new Map(
        db.prepare('SELECT "from", "table", "to" FROM pragma_foreign_key_list(?)').all(name)
          .map((fk) => [fk.from, `${fk.table}.${fk.to ?? ''}`.replace(/\.$/, '')]),
      );
      const columns = db
        .prepare('SELECT name, type, pk, "notnull" FROM pragma_table_info(?) ORDER BY cid')
        .all(name)
        .map((c) => ({
          name: c.name,
          type: c.type || '',
          primaryKey: c.pk > 0,
          notNull: c.notnull === 1,
          references: fks.get(c.name) ?? null,
        }));
      const rowCount = db.prepare(`SELECT COUNT(*) FROM ${quoteIdent(name)}`).pluck().get();
      return { name, rowCount: Number(rowCount), columns };
    });
  } finally {
    db.close();
  }
}

// Cap SQLite's own memory (e.g. `SELECT randomblob(1e9)`), separately from the JS heap
// limit the parent sets with --max-old-space-size.
{
  const probe = new Database(':memory:');
  probe.pragma(`hard_heap_limit = ${Number(process.env.SQL_PLAYGROUND_HEAP_BYTES) || 256 * 1024 * 1024}`);
  probe.close();
}

process.on('message', (msg) => {
  let reply;
  try {
    const value = msg.kind === 'schema' ? schema(msg) : execute(msg);
    reply = { id: msg.id, ok: true, value };
  } catch (err) {
    reply = { id: msg.id, ok: false, error: err && err.message ? err.message : String(err) };
  }
  process.send(reply);
});
