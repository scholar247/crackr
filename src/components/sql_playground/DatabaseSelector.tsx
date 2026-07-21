import { useState } from "react";
import {
  Database, Plus, ChevronRight, Loader2, CheckCircle,
  Trash2, Clock, Table2, HardDrive, X, Eye, EyeOff,
  Zap, Shield, Globe,
} from "lucide-react";
import type { DbConnection, DbEngine, Theme } from  "@/types/sql_play";
import { SEED_CONNECTIONS } from "./mockData";

// ─── Engine metadata ──────────────────────────────────────────────────────────
const ENGINE_META: Record<DbEngine, { label: string; defaultPort: number; color: string; icon: string }> = {
  postgresql: { label: "PostgreSQL",  defaultPort: 5432,  color: "#336791", icon: "🐘" },
  mysql:      { label: "MySQL",       defaultPort: 3306,  color: "#f29111", icon: "🐬" },
  sqlite:     { label: "SQLite",      defaultPort: 0,     color: "#44a1ff", icon: "🗃️" },
  mssql:      { label: "SQL Server",  defaultPort: 1433,  color: "#cc2927", icon: "🪟" },
  mongodb:    { label: "MongoDB",     defaultPort: 27017, color: "#4db33d", icon: "🍃" },
};

interface CardProps {
  conn: DbConnection;
  onConnect: (conn: DbConnection) => void;
  connecting: string | null;
}

function ConnectionCard({ conn, onConnect, connecting }: CardProps) {
  const meta = ENGINE_META[conn.engine];
  const primary ="#0f9d8a";
  const isConnecting = connecting === conn.id;

  return (
    <div className="group relative flex flex-col rounded-2xl p-5 transition-all cursor-pointer"
      style={{ background: "var(--card)", border: `1px solid var(--border)` }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}>

      {/* Engine badge + color dot */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0">
          {meta.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
            {conn.name}
          </div>
          <div className="text-xs font-medium mt-0.5">
            {meta.label}
          </div>
        </div>
      </div>

      {/* Connect button */}
      <button onClick={() => onConnect(conn)} disabled={!!connecting}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 hover:brightness-110"
        style={{
          background: isConnecting ? `${primary}20` : `linear-gradient(135deg, ${primary}, ${"#0d7a6b"})`,
          color: isConnecting ? primary : "#fff",
          border: isConnecting ? `1px solid ${primary}40` : "none",
        }}>
        {isConnecting
          ? <><Loader2 size={13} className="animate-spin" /> Connecting…</>
          : <><ChevronRight size={13} /> Connect</>}
      </button>
    </div>
  );
}

// ─── Database Selector ────────────────────────────────────────────────────────

interface Props {
  onConnect: (conn: string) => void;
}

export default function DatabaseSelector({ onConnect }: Props) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const primary = "#0f9d8a";

  const handleConnect = (conn: DbConnection) => {
    setConnecting(conn.id);
    setTimeout(() => {
      setConnecting(null);
      onConnect(conn.template);
    }, 1200);
  };


  return (
    <div className="flex flex-col"
      style={{ background: "var(--background)", fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 h-14 shrink-0">
        <div className="flex flex-col leading-none">
          <span className="text-md" style={{ color: primary, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", lineHeight: 1 }}>
            SQL Playground
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "rgba(61,214,140,0.08)", border: "1px solid rgba(61,214,140,0.2)", color: "#3dd68c" }}>
          <Shield size={11} />
          <span>TLS Encrypted</span>
        </div>
      </header>

      {/* Body: left panel + right form/empty */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: connection list */}
        <div className="flex flex-col flex-1 overflow-hidden p-6 gap-6">
          {/* Hero row */}
          <div className="flex items-end justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>
                Select a Database
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                Choose a saved connection to open the playground.
              </p>
            </div>
          </div>
          <div className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {SEED_CONNECTIONS.map(conn  => (
                  <ConnectionCard key={conn.id} conn={conn}
                    onConnect={handleConnect} connecting={connecting} />
                ))}
              </div>
        </div>
      </div>
    </div>
  );
}
