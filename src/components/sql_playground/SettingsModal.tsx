import { X } from "lucide-react";
import type { Theme } from "../../types/sql_play";

interface Props {
  theme: Theme;
  sidebarOpen: boolean;
  limit: string;
  primaryColor: string;
  onClose: () => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
}

export default function SettingsModal({
  theme,
  sidebarOpen,
  limit,
  primaryColor,
  onClose,
  onToggleTheme,
  onToggleSidebar,
}: Props) {
  const rows = [
    { label: "Theme", value: theme === "dark" ? "🌙 Dark" : "☀️ Light", action: onToggleTheme },
    { label: "Schema Sidebar", value: sidebarOpen ? "Visible" : "Hidden", action: onToggleSidebar },
    { label: "Row Limit", value: limit, action: () => {} },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-[400px] shadow-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div>
            <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Settings
            </h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              SQL Playground preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {row.label}
            </span>
            <button
              onClick={row.action}
              className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{
                background: "var(--secondary)",
                color: "var(--foreground)",
                fontFamily: "'JetBrains Mono', monospace",
                border: "1px solid var(--border)",
              }}
            >
              {row.value}
            </button>
          </div>
        ))}

        {/* Shortcuts */}
        <div
          className="mt-4 pt-4 flex items-center gap-3 flex-wrap"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Shortcuts:
          </span>
          {[["⌘↵", "Run"], ["Tab", "Indent"]].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 text-xs">
              <kbd
                className="px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: primaryColor,
                  fontSize: "11px",
                }}
              >
                {key}
              </kbd>
              <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
