"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Table2,
  Hash,
  Search,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";

interface Props {
  onInsert: (text: string) => void;
  template: string;
}

interface Column {
  name: string;
}

interface Table {
  name: string;
  columns: Column[];
}

const SQL = `
SELECT
    m.name AS table_name,
    p.name AS column_name
FROM sqlite_schema m
JOIN pragma_table_info(m.name) p
WHERE m.type = 'table'
  AND m.name NOT LIKE 'sqlite_%'
ORDER BY table_name, p.cid;
`;

export default function SchemaSidebar({ onInsert, template }: Props) {
  const [tables, setTables] = useState<Table[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSchema = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/sql/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: template,
          sql: SQL,
        }),
      });

      const data = await res.json();

      if (!data.status) throw new Error(data.error);

      const grouped = data.result.reduce(
        (acc: Record<string, Column[]>, row: any) => {
          if (!acc[row.table_name]) {
            acc[row.table_name] = [];
          }

          acc[row.table_name].push({
            name: row.column_name,
          });

          return acc;
        },
        {} as Record<string, Column[]>
      );

      const parsedTables = (Object.entries(grouped) as [string, Column[]][]).map(([name, columns]): Table => ({
        name,
        columns,
      }));

      setTables(parsedTables);

      if (parsedTables.length) {
        setExpanded(new Set([parsedTables[0].name]));
      }
    } catch (err) {
      console.error(err);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);
  useEffect(()=>{
    loadSchema();
  },[template]);

  const filteredTables = useMemo(() => {
    if (!search) return tables;

    return tables.filter(
      (table) =>
        table.name.toLowerCase().includes(search.toLowerCase()) ||
        table.columns.some((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        )
    );
  }, [tables, search]);

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(name)) next.delete(name);
      else next.add(name);

      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="font-semibold uppercase tracking-widest"
          style={{
            color: "var(--muted-foreground)",
            fontSize: "10px",
          }}
        >
          Schema Explorer
        </span>

        <button
          onClick={loadSchema}
          className="p-1 rounded transition-opacity hover:opacity-70"
        >
          {loading ? (
            <Loader2
              size={11}
              className="animate-spin"
              style={{ color: "var(--muted-foreground)" }}
            />
          ) : (
            <RefreshCw
              size={11}
              style={{ color: "var(--muted-foreground)" }}
            />
          )}
        </button>
      </div>

      {/* Database */}
      <div className="px-3 py-2 shrink-0">
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#3dd68c" }}
          />

          <span
            className="text-xs font-medium flex-1 truncate"
            style={{ color: "var(--foreground)" }}
          >
            {template}
          </span>

          <ChevronDown
            size={11}
            style={{ color: "var(--muted-foreground)" }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 shrink-0">
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2"
          style={{
            background: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          <Search
            size={12}
            style={{ color: "var(--muted-foreground)" }}
          />

          <input
            className="bg-transparent text-xs outline-none flex-1"
            placeholder="Search tables, columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: "var(--foreground)" }}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              <X
                size={10}
                style={{ color: "var(--muted-foreground)" }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div
          className="px-2 py-1.5 mb-1"
          style={{
            color: "var(--muted-foreground)",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Tables ({filteredTables.length})
        </div>

        {loading && (
          <div className="flex justify-center mt-6">
            <Loader2 className="animate-spin" size={18} />
          </div>
        )}

        {!loading &&
          filteredTables.map((table) => {
            const open = expanded.has(table.name);

            return (
              <div key={table.name}>
                <button
                  onClick={() => toggle(table.name)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-[var(--accent)]"
                >
                  {open ? (
                    <ChevronDown size={11} />
                  ) : (
                    <ChevronRight size={11} />
                  )}

                  <Table2
                    size={13}
                    style={{ color: "var(--primary)" }}
                  />

                  <span
                    className="text-xs font-medium"
                    style={{
                      fontFamily: "JetBrains Mono",
                    }}
                  >
                    {table.name}
                  </span>
                </button>

                {open && (
                  <div
                    className="ml-4 pl-3"
                    style={{
                      borderLeft: "1px solid var(--border)",
                    }}
                  >
                    {table.columns.map((column) => (
                      <button
                        key={column.name}
                        onClick={() => onInsert(column.name)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[var(--accent)]"
                      >
                        <Hash
                          size={10}
                          style={{
                            color: "var(--muted-foreground)",
                          }}
                        />

                        <span
                          className="text-xs"
                          style={{
                            fontFamily: "JetBrains Mono",
                          }}
                        >
                          {column.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}