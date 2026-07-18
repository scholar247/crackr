export interface Column {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
}

export interface TableDef {
  name: string;
  rowCount: string;
  columns: Column[];
}

export interface DbSchema {
  name: string;
  tables: TableDef[];
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  executionTime: number;
  planningTime: number;
  totalRows: number;
  affectedRows?: number;
  error?: string;
}

export interface Tab {
  id: string;
  title: string;
  query: string;
  result: QueryResult | null;
  isRunning: boolean;
}

export interface HistoryItem {
  id: number;
  query: string;
  time: string;
  duration: string;
  rows: number;
  status: "success" | "error";
}

export type Theme = "dark" | "light";
export type BottomPanel = "results" | "history";

export type DbEngine = "postgresql" | "mysql" | "sqlite" | "mssql" | "mongodb";

export interface DbConnection {
  id: string;
  name: string;
  template: string;
  engine: DbEngine;
}
