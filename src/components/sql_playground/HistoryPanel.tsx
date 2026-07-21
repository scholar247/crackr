import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { HistoryItem } from "@/types/sql_play";

interface Props {
  history: HistoryItem[];
  primaryColor: string;
  onLoad: (item: HistoryItem) => void;
}

export default function HistoryPanel({ history, primaryColor, onLoad }: Props) {
  if (history.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "var(--muted-foreground)" }}
      >
        No query history yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {history.map((item) => (
        <button
          key={item.id}
          onClick={() => onLoad(item)}
          className="flex flex-col gap-1.5 px-4 py-3 text-left transition-colors group"
          style={{ borderBottom: "1px solid var(--border)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(108,99,255,0.04)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          <div className="flex items-start gap-2">
            {item.status === "success" ? (
              <CheckCircle size={11} className="shrink-0 mt-0.5" style={{ color: "#3dd68c" }} />
            ) : (
              <AlertCircle size={11} className="shrink-0 mt-0.5" style={{ color: "#f16a7b" }} />
            )}
            <span
              className="text-xs flex-1 truncate leading-relaxed"
              style={{
                color: "var(--foreground)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {item.query}
            </span>
          </div>

          <div className="flex items-center gap-3 pl-5">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: primaryColor, fontFamily: "'JetBrains Mono', monospace" }}
            >
              <Clock size={10} />
              {item.duration}
            </span>
            <span
              className="text-xs"
              style={{
                color: "var(--muted-foreground)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {item.rows.toLocaleString()} rows
            </span>
            <span
              className="text-xs ml-auto"
              style={{ color: "var(--muted-foreground)" }}
            >
              {item.time}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
