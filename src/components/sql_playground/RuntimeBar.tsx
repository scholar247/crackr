import { AlertCircle, CheckCircle, Timer, Zap, TrendingUp, Rows3, Database } from "lucide-react";
import type { QueryResult } from "@/types/sql_play";

interface Props {
  result: QueryResult;
}

export default function RuntimeBar({ result }: Props) {
  const isError = !!result.error;
  const totalTime = result.executionTime + result.planningTime;

  const speedColor =
    totalTime < 50 ? "#3dd68c" : totalTime < 200 ? "#f9c74f" : "#f16a7b";

  const stats = [
    {
      icon: <Timer size={13} />,
      label: "Total time",
      value: `${totalTime.toFixed(1)} ms`,
      color: isError ? "var(--destructive)" : speedColor,
    },
    {
      icon: <Zap size={13} />,
      label: "Exec time",
      value: `${result.executionTime} ms`,
      color: "var(--primary)",
    },
    {
      icon: <TrendingUp size={13} />,
      label: "Planning",
      value: `${result.planningTime.toFixed(1)} ms`,
      color: "#4cc9f0",
    },
    {
      icon: <Rows3 size={13} />,
      label: "Rows returned",
      value: result.rows.length.toLocaleString(),
      color: "var(--foreground)",
    },
    {
      icon: <Database size={13} />,
      label: "Total in table",
      value: result.totalRows > 0 ? result.totalRows.toLocaleString() : "—",
      color: "var(--muted-foreground)",
    },
  ];

  return (
    <div
      className="flex items-stretch gap-0 shrink-0"
      style={{
        borderBottom: "1px solid var(--border)",
        background: isError
          ? "rgba(241,106,123,0.05)"
          : "rgba(108,99,255,0.04)",
      }}
    >
      {/* Status badge */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ borderRight: "1px solid var(--border)", minWidth: "130px" }}
      >
        {isError ? (
          <>
            <AlertCircle size={14} style={{ color: "#f16a7b" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: "#f16a7b", fontFamily: "'JetBrains Mono', monospace" }}
            >
              ERROR
            </span>
          </>
        ) : (
          <>
            <CheckCircle size={14} style={{ color: "#3dd68c" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: "#3dd68c", fontFamily: "'JetBrains Mono', monospace" }}
            >
              SUCCESS
            </span>
          </>
        )}
      </div>

      {/* Stats */}
      {!isError &&
        stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col justify-center px-4 py-1.5 shrink-0"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center gap-1.5 mb-0.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {s.icon}
              <span className="text-xs">{s.label}</span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {s.value}
            </span>
          </div>
        ))}

      {/* Speed bar */}
      {!isError && (
        <div className="flex items-center gap-2 px-4 ml-auto">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {totalTime < 50 ? "⚡ Fast" : totalTime < 200 ? "✦ Normal" : "⚠ Slow"}
          </span>
          <div className="flex gap-0.5">
            {[50, 200, 500].map((threshold, i) => (
              <div
                key={i}
                className="w-2 h-4 rounded-sm"
                style={{
                  background:
                    totalTime <= threshold
                      ? i === 0 ? "#3dd68c" : i === 1 ? "#f9c74f" : "#f16a7b"
                      : "var(--muted)",
                  opacity: totalTime > threshold && i > 0 ? 0.3 : 1,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
