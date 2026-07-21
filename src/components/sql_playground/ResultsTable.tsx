import { useState } from "react";
import { AlertCircle,ArrowUp,ArrowDown, CheckCircle, Copy, Download, Filter, X } from "lucide-react";
import type { QueryResult } from "@/types/sql_play";
import RuntimeBar from "./RuntimeBar";

interface Props {
  result: QueryResult;
}

const PAGE_SIZE = 50;

function cellStyle(val: unknown): React.CSSProperties {
  if (val === null || val === undefined)
    return { color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.5 };
  if (typeof val === "boolean") return { color: val ? "#3dd68c" : "#f16a7b" };
  if (typeof val === "number") return { color: "#f9c74f" };
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val))
    return { color: "#4cc9f0" };
  return { color: "var(--foreground)" };
}

export default function ResultsTable({ result }: Props) {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterText, setFilterText] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (result.error) {
    return (
      <div className="flex flex-col h-full">
        <RuntimeBar result={result} />
        <div
          className="flex items-start gap-3 p-5 m-4 rounded-lg"
          style={{
            background: "rgba(241,106,123,0.07)",
            border: "1px solid rgba(241,106,123,0.2)",
          }}
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: "#f16a7b" }} />
          <pre
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#f16a7b",
              whiteSpace: "pre-wrap",
              fontSize: "12px",
            }}
          >
            {result.error}
          </pre>
        </div>
      </div>
    );
  }
const isDataQuery =
  result.columns.length > 0 && Array.isArray(result.rows);

const metadata = result as
  | {
      changes?: number;
      lastInsertRowid?: number;
    }
  | undefined;

if (!isDataQuery) {
  return (
    <div className="flex flex-col h-full">
      <RuntimeBar result={result} />

      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="max-w-md w-full rounded-xl p-6 text-center"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <CheckCircle
            size={42}
            className="mx-auto mb-4"
            style={{ color: "#3dd68c" }}
          />

          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Query executed successfully
          </h3>

          <p
            className="mt-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            This statement did not return a result set.
          </p>
        </div>
      </div>
    </div>
  );
}
  const filtered = filterText
    ? result.rows.filter((row) =>
        row.some((c) =>
          String(c ?? "").toLowerCase().includes(filterText.toLowerCase())
        )
      )
    : result.rows;

  const sorted =
    sortCol !== null
      ? [...filtered].sort((a, b) => {
          const av = a[sortCol], bv = b[sortCol];
          const cmp =
            av == null ? -1 : bv == null ? 1 : av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        })
      : filtered;

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (i: number) => {
    if (sortCol === i) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(i); setSortDir("asc"); }
    setPage(0);
  };

  const copyCell = (val: string, key: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };

  const exportCSV = () => {
    const header = result.columns.join(",");
    const body = sorted
      .map((r) =>
        r.map((c) =>
          c == null ? "NULL" : `"${String(c).replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "results.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-xs shrink-0"
          style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          {filtered.length !== result.rows.length
            ? `${filtered.length.toLocaleString()} / ${result.rows.length.toLocaleString()}`
            : result.rows.length.toLocaleString()}{" "}
          rows
        </span>
        {result.executionTime > 0 && (
          <>
            <div className="w-px h-3" style={{ background: "var(--border)" }} />
            <span
              className="text-xs shrink-0"
              style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {result.executionTime}ms
            </span>
          </>
        )}

        {/* Filter */}
        <div
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 ml-1 flex-1"
          style={{
            background: "var(--muted)",
            border: "1px solid var(--border)",
            maxWidth: "260px",
          }}
        >
          <Filter size={10} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <input
            className="bg-transparent outline-none flex-1 text-xs"
            placeholder="Filter results…"
            value={filterText}
            onChange={e => { setFilterText(e.target.value); setPage(0); }}
            style={{
              color: "var(--foreground)",
              fontFamily: "'JetBrains Mono', monospace",
              minWidth: 0,
            }}
          />
          {filterText && (
            <button
              onClick={() => setFilterText("")}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={10} style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-opacity hover:opacity-80"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <Download size={10} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(124,108,252,0.25) transparent" }}>
        <table
          className="w-full border-collapse text-xs"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <thead className="sticky top-0 z-10">
            <tr style={{ background: "var(--card)", borderBottom: "2px solid var(--border)" }}>
              <th
                className="text-center select-none font-medium shrink-0"
                style={{
                  width: "48px",
                  minWidth: "48px",
                  padding: "8px 10px",
                  color: "var(--muted-foreground)",
                  borderRight: "1px solid var(--border)",
                  fontSize: "10px",
                  background: "rgba(0,0,0,0.2)",
                  letterSpacing: "0.05em",
                }}
              >
                #
              </th>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="text-left cursor-pointer select-none group transition-colors"
                  style={{
                    padding: "8px 12px",
                    color: "var(--foreground)",
                    borderRight: "1px solid var(--border)",
                    minWidth: "120px",
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,108,252,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="uppercase"
                      style={{ fontSize: "10px", letterSpacing: "0.08em", color: sortCol === i ? "var(--primary)" : "var(--foreground)" }}
                    >
                      {col}
                    </span>
                    <span className="ml-auto transition-opacity" style={{ opacity: sortCol === i ? 1 : 0.2 }}>
                      {sortCol === i
                        ? sortDir === "asc"
                          ? <ArrowUp size={9} style={{ color: "var(--primary)" }} />
                          : <ArrowDown size={9} style={{ color: "var(--primary)" }} />
                        : <span style={{ fontSize: "9px", color: "var(--muted-foreground)" }}>↕</span>}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => {
              const globalIdx = page * PAGE_SIZE + ri + 1;
              return (
                <tr
                  key={ri}
                  className="group transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,108,252,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <td
                    className="text-center select-none"
                    style={{
                      padding: "6px 10px",
                      color: "var(--muted-foreground)",
                      borderRight: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.12)",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "11px",
                    }}
                  >
                    {globalIdx}
                  </td>
                  {row.map((cell, ci) => {
                    const key = `${ri}-${ci}`;
                    const display = cell === null || cell === undefined ? "NULL" : String(cell);
                    return (
                      <td
                        key={ci}
                        className="relative"
                        style={{
                          padding: "6px 12px",
                          borderRight: "1px solid var(--border)",
                          maxWidth: "280px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={display}
                      >
                        <span style={cellStyle(cell)}>{display}</span>
                        <button
                          onClick={() => copyCell(display, key)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity p-0.5 rounded"
                          style={{ background: "var(--muted)" }}
                        >
                          {copiedKey === key
                            ? <CheckCircle size={9} style={{ color: "#34d399" }} />
                            : <Copy size={9} style={{ color: "var(--muted-foreground)" }} />
                          }
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div
            className="flex items-center justify-center py-16 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            No rows match the filter
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0 text-xs"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--muted-foreground)",
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {(page * PAGE_SIZE + 1).toLocaleString()}–
            {Math.min((page + 1) * PAGE_SIZE, sorted.length).toLocaleString()} of{" "}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-0.5">
            {[
              { label: "«", action: () => setPage(0), disabled: page === 0 },
              { label: "‹", action: () => setPage(p => p - 1), disabled: page === 0 },
              { label: "›", action: () => setPage(p => p + 1), disabled: page === totalPages - 1 },
              { label: "»", action: () => setPage(totalPages - 1), disabled: page === totalPages - 1 },
            ].map(btn => (
              <button
                key={btn.label}
                disabled={btn.disabled}
                onClick={btn.action}
                className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
                onMouseEnter={e => { if (!btn.disabled) e.currentTarget.style.background = "rgba(124,108,252,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = ""; }}
              >
                {btn.label}
              </button>
            ))}
            <span
              className="px-2 ml-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}
            >
              {page + 1} / {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
