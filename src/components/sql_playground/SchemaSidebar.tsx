import { useState } from "react";
import { ChevronRight, ChevronDown, Table2, Key, Link, Hash, Search, RefreshCw, X } from "lucide-react";
import { MOCK_SCHEMA } from "./mockData";
import { columnTypeColor } from "../../lib/sqlHighlight";

interface Props {
  onInsert: (text: string) => void;
}

export default function SchemaSidebar({ onInsert }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["users"]));
  const [search, setSearch] = useState("");

  const db = MOCK_SCHEMA[0];

  const tables = search
    ? db.tables.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.columns.some((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          )
      )
    : db.tables;

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)", fontSize: "10px" }}
        >
          Schema Explorer
        </span>
        <button className="p-1 rounded transition-opacity hover:opacity-70">
          <RefreshCw size={11} style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* DB badge */}
      <div className="px-3 py-2 shrink-0">
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#3dd68c" }}
          />
          <span
            className="text-xs font-medium flex-1 truncate"
            style={{ color: "var(--foreground)" }}
          >
            {db.name}
          </span>
          <ChevronDown size={11} style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 shrink-0">
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <Search size={12} style={{ color: "var(--muted-foreground)" }} />
          <input
            className="bg-transparent text-xs outline-none flex-1"
            placeholder="Search tables, columns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={10} style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div
          className="px-2 py-1.5 mb-1"
          style={{ color: "var(--muted-foreground)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          Tables ({tables.length})
        </div>

        {tables.map((table) => {
          const isOpen = expanded.has(table.name);
          return (
            <div key={table.name} className="mb-0.5">
              <button
                onClick={() => toggle(table.name)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left group transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                {isOpen ? (
                  <ChevronDown size={11} style={{ color: "var(--muted-foreground)" }} />
                ) : (
                  <ChevronRight size={11} style={{ color: "var(--muted-foreground)" }} />
                )}
                <Table2 size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span
                  className="text-xs font-medium flex-1 truncate"
                  style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {table.name}
                </span>
                <span
                  className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {table.rowCount}
                </span>
              </button>

              {isOpen && (
                <div className="ml-4 pl-3" style={{ borderLeft: "1px solid var(--border)" }}>
                  {table.columns.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => onInsert(col.name)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left group/col transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {col.isPrimary ? (
                        <Key size={10} style={{ color: "#f9c74f", flexShrink: 0 }} />
                      ) : col.isForeign ? (
                        <Link size={10} style={{ color: "#4cc9f0", flexShrink: 0 }} />
                      ) : (
                        <Hash size={10} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                      )}
                      <span
                        className="text-xs flex-1 truncate"
                        style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {col.name}
                      </span>
                      <span
                        className="text-xs opacity-50 group-hover/col:opacity-100 transition-opacity truncate"
                        style={{ color: columnTypeColor(col.type), fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {col.type}
                      </span>
                      {col.isNullable && (
                        <span style={{ color: "var(--muted-foreground)", opacity: 0.4, fontSize: "11px" }}>?</span>
                      )}
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
