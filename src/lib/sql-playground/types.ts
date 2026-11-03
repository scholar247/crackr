// Shapes shared by the SQL playground API (src/app/api/v1/sql-playground) and its UI.

export type SqlCell = string | number | null;

/** Result of running a script: describes the LAST statement in it, like most SQL consoles. */
export interface SqlExecuteResult {
  /** Column names, in order. Kept separate from rows so duplicate names (a join selecting
   * two `id` columns) and zero-row results still show their headers. */
  columns: string[];
  rows: SqlCell[][];
  /** True when the statement returned rows (SELECT, PRAGMA, RETURNING …). */
  isQuery: boolean;
  /** Rows changed by the last INSERT/UPDATE/DELETE. */
  changes: number;
  /** True when more rows existed than SQL_MAX_ROWS and the rest were dropped. */
  truncated: boolean;
  statementCount: number;
  executionTimeMs: number;
}

export interface SqlSchemaColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  /** "table.column" this column references, if it is a foreign key. */
  references: string | null;
}

export interface SqlSchemaTable {
  name: string;
  rowCount: number;
  columns: SqlSchemaColumn[];
}

/** One run of a query, as shown in a tab. */
export interface QueryRun {
  id: number;
  result: SqlExecuteResult | null;
  error: string | null;
}

export interface Tab {
  id: string;
  title: string;
  query: string;
  run: QueryRun | null;
  isRunning: boolean;
}

export interface HistoryItem {
  id: number;
  query: string;
  time: string;
  durationMs: number;
  rows: number;
  status: 'success' | 'error';
}

export type BottomPanel = 'results' | 'history';
