import type { HistoryItem,DbSchema } from "../../types/sql_play";

export const MOCK_SCHEMA: DbSchema[] = [
  {
    name: "production_db",
    tables: [
      {
        name: "users",
        rowCount: "2.4M",
        columns: [
          { name: "id", type: "BIGSERIAL", isPrimary: true },
          { name: "email", type: "VARCHAR(255)", isUnique: true },
          { name: "username", type: "VARCHAR(100)", isUnique: true },
          { name: "full_name", type: "VARCHAR(255)" },
          { name: "avatar_url", type: "TEXT", isNullable: true },
          { name: "created_at", type: "TIMESTAMPTZ" },
          { name: "updated_at", type: "TIMESTAMPTZ" },
          { name: "is_active", type: "BOOLEAN" },
          { name: "role", type: "VARCHAR(50)" },
        ],
      },
      {
        name: "orders",
        rowCount: "12.8M",
        columns: [
          { name: "id", type: "BIGSERIAL", isPrimary: true },
          { name: "user_id", type: "BIGINT", isForeign: true },
          { name: "status", type: "VARCHAR(50)" },
          { name: "total_amount", type: "DECIMAL(10,2)" },
          { name: "currency", type: "VARCHAR(3)" },
          { name: "created_at", type: "TIMESTAMPTZ" },
          { name: "shipped_at", type: "TIMESTAMPTZ", isNullable: true },
          { name: "notes", type: "TEXT", isNullable: true },
        ],
      },
      {
        name: "products",
        rowCount: "48K",
        columns: [
          { name: "id", type: "BIGSERIAL", isPrimary: true },
          { name: "name", type: "VARCHAR(255)" },
          { name: "sku", type: "VARCHAR(100)", isUnique: true },
          { name: "description", type: "TEXT", isNullable: true },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "stock", type: "INTEGER" },
          { name: "category_id", type: "BIGINT", isForeign: true },
        ],
      },
      {
        name: "sessions",
        rowCount: "89.2M",
        columns: [
          { name: "id", type: "UUID", isPrimary: true },
          { name: "user_id", type: "BIGINT", isForeign: true },
          { name: "token", type: "TEXT" },
          { name: "ip_address", type: "INET", isNullable: true },
          { name: "expires_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "categories",
        rowCount: "312",
        columns: [
          { name: "id", type: "BIGSERIAL", isPrimary: true },
          { name: "name", type: "VARCHAR(100)", isUnique: true },
          { name: "slug", type: "VARCHAR(100)", isUnique: true },
          { name: "parent_id", type: "BIGINT", isForeign: true, isNullable: true },
        ],
      },
    ],
  },
];

export const INITIAL_HISTORY: HistoryItem[] = [];

export const DEFAULT_QUERY = `-- Welcome to SQL Playground · Scholar247
-- You can write your SQL queries here and execute them by pressing Ctrl+Enter (or Cmd+Enter).`;
