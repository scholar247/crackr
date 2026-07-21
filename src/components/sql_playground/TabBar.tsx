import { Plus, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { Tab } from "@/types/sql_play";

interface Props {
  tabs: Tab[];
  activeTab: string;
  primaryColor: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string, e: React.MouseEvent) => void;
}

export default function TabBar({ tabs, activeTab, primaryColor, onSelect, onAdd, onClose }: Props) {
  return (
    <div
      className="flex items-end gap-0.5 px-2 pt-1 shrink-0 overflow-x-auto"
      style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-lg transition-all relative shrink-0 group"
            style={{
              background: active ? "var(--background)" : "transparent",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              borderTop: active ? `1px solid ${primaryColor}` : "1px solid transparent",
              borderLeft: active ? "1px solid var(--border)" : "1px solid transparent",
              borderRight: active ? "1px solid var(--border)" : "1px solid transparent",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: active ? "-1px" : "0",
              fontWeight: active ? 600 : 400,
            }}
          >
            {tab.isRunning ? (
              <Loader2 size={10} className="animate-spin" style={{ color: primaryColor }} />
            ) : tab.result?.error ? (
              <AlertCircle size={10} style={{ color: "#f16a7b" }} />
            ) : tab.result ? (
              <CheckCircle size={10} style={{ color: "#3dd68c" }} />
            ) : (
              <FileText size={10} />
            )}

            <span>{tab.title}</span>

            {tabs.length > 1 && (
              <span
                onClick={(e) => onClose(tab.id, e)}
                className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity p-0.5 rounded ml-0.5"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(241,106,123,0.2)";
                  e.currentTarget.style.color = "#f16a7b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "";
                }}
              >
                <X size={9} />
              </span>
            )}
          </button>
        );
      })}

      <button
        onClick={onAdd}
        className="px-2 py-1.5 mb-0.5 rounded-lg transition-opacity hover:opacity-80"
        style={{ color: "var(--muted-foreground)" }}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
