import { useState } from "react";
import { AlertCircle, CheckCircle, Copy, Download, Filter, X } from "lucide-react";
import type { QueryResult } from "../../types/sql_play";
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

  if (!result.columns.length) return null;

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
      <RuntimeBar result={result} />

      {/* Filter & export */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 flex-1"
          style={{
            background: "var(--muted)",
            maxWidth: "260px",
            border: "1px solid var(--border)",
          }}
        >
          <Filter size={11} style={{ color: "var(--muted-foreground)" }} />
          <input
            className="bg-transparent text-xs outline-none flex-1"
            placeholder="Filter results…"
            value={filterText}
            onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
            style={{
              color: "var(--foreground)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          {filterText && (
            <button onClick={() => setFilterText("")}>
              <X size={10} style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        <span
          className="text-xs"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {filtered.length.toLocaleString()} / {result.rows.length.toLocaleString()} rows
        </span>

        <div className="ml-auto">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-opacity hover:opacity-80"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full text-xs border-collapse"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <thead className="sticky top-0 z-10">
            <tr style={{ background: "var(--muted)", borderBottom: "2px solid var(--border)" }}>
              {/* Index column header */}
              <th
                className="text-center px-3 py-2.5 select-none font-semibold"
                style={{
                  color: "var(--muted-foreground)",
                  borderRight: "1px solid var(--border)",
                  width: "52px",
                  minWidth: "52px",
                  background: "var(--card)",
                }}
              >
                #
              </th>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="text-left px-3 py-2.5 cursor-pointer select-none whitespace-nowrap group"
                  style={{
                    color: "var(--foreground)",
                    borderRight: "1px solid var(--border)",
                    minWidth: "130px",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{col}</span>
                    <span className="opacity-0 group-hover:opacity-50 transition-opacity">
                      {sortCol === i ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(108,99,255,0.04)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  {/* Row index */}
                  <td
                    className="text-center px-3 py-2 font-medium select-none"
                    style={{
                      color: "var(--muted-foreground)",
                      borderRight: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.12)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {globalIdx}
                  </td>
                  {row.map((cell, ci) => {
                    const key = `${ri}-${ci}`;
                    const display = cell === null ? "NULL" : String(cell);
                    return (
                      <td
                        key={ci}
                        className="px-3 py-2 relative group/cell"
                        style={{
                          borderRight: "1px solid var(--border)",
                          maxWidth: "280px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={cellStyle(cell)}>{display}</span>
                        <button
                          onClick={() => copyCell(display, key)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded"
                          style={{ background: "var(--muted)" }}
                        >
                          {copiedKey === key ? (
                            <CheckCircle size={9} style={{ color: "#3dd68c" }} />
                          ) : (
                            <Copy size={9} style={{ color: "var(--muted-foreground)" }} />
                          )}
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
            className="flex items-center justify-center py-12 text-sm"
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
          style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Rows {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, sorted.length).toLocaleString()} of{" "}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            {[
              { label: "«", action: () => setPage(0), disabled: page === 0 },
              { label: "‹", action: () => setPage((p) => p - 1), disabled: page === 0 },
              { label: "›", action: () => setPage((p) => p + 1), disabled: page === totalPages - 1 },
              { label: "»", action: () => setPage(totalPages - 1), disabled: page === totalPages - 1 },
            ].map((btn) => (
              <button
                key={btn.label}
                disabled={btn.disabled}
                onClick={btn.action}
                className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-25 transition-opacity hover:opacity-80"
                style={{
                  background: "var(--muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {btn.label}
              </button>
            ))}
            <span className="px-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {page + 1} / {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
