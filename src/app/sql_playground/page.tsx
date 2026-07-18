"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sun, Moon, LayoutPanelLeft, Settings, Terminal,
  BarChart2, History, Rows3, AlertCircle, CheckCircle, Loader2,
} from "lucide-react";

import type { Tab, HistoryItem,DbConnection, Theme, BottomPanel } from "../../types/sql_play";
import { INITIAL_HISTORY, DEFAULT_QUERY } from "../../components/sql_playground/mockData";
import { formatSQL } from "../../lib/sqlHighlight";
import SchemaSidebar from "../../components/sql_playground/SchemaSidebar";
import TabBar from "../../components/sql_playground/TabBar";
import EditorToolbar from "../../components/sql_playground/EditorToolbar";
import SQLEditor from "../../components/sql_playground/SQLEditor";
import ResultsTable from "../../components/sql_playground/ResultsTable";
import HistoryPanel from "../../components/sql_playground/HistoryPanel";
import DatabaseSelector from "@/components/sql_playground/DatabaseSelector";

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Query 1", query: DEFAULT_QUERY, result: null, isRunning: false },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>("results");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>("dark");
  const [editorHeight, setEditorHeight] = useState(44);
  const [showSettings, setShowSettings] = useState(false);
  const [limit, setLimit] = useState("1000");
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [selectedDb, setSelectedDb] = useState<DbConnection | null>(null);

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  const primaryColor = theme === "light" ? "#0f9d8a" : "#6c63ff";

  // ── Tab helpers ──────────────────────────────────────────────────────────────

  const setTabQuery = (id: string, query: string) =>
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, query } : t)));

  const addTab = () => {
    const id = String(Date.now());
    setTabs((ts) => [
      ...ts,
      { id, title: `Query ${ts.length + 1}`, query: "", result: null, isRunning: false },
    ]);
    setActiveTab(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (activeTab === id) setActiveTab(next[Math.max(0, idx - 1)].id);
  };

const updateTabTitle = (sql: string, template: string) => {
  const firstLine = sql
    .trim()
    .split("\n")[0]
    .replace(/\s+/g, " ")
    .substring(0, 30);

  const title =
    firstLine.length > 0
      ? firstLine
      : `${template} Query`;

  setTabs((tabs) =>
    tabs.map((tab) =>
      tab.id === activeTab
        ? {
            ...tab,
            title,
          }
        : tab
    )
  );
};
  // ── Query execution ──────────────────────────────────────────────────────────

  const runQuery = async (id: string) => {
    if (!selectedDb) return;

    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    setTabs((ts) =>
        ts.map((t) =>
            t.id === id
                ? { ...t, isRunning: true }
                : t
        )
    );

    try {

        const response = await fetch("/api/sql/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                template: selectedDb.template,
                sql: tab.query,
            }),
        });

        const data = await response.json();

const rawRows = Array.isArray(data.result) ? data.result : [];

const columns =
    rawRows.length > 0
        ? Object.keys(rawRows[0])
        : [];

const rows = rawRows.map(row =>
    columns.map(col => row[col])
);

const result = {
    columns,
    rows,
    executionTime: data.executionTime,
    planningTime: 0,
    totalRows: rows.length,
    error: data.status ? null : data.error,
    metadata: {},
};

        setTabs((ts) =>
            ts.map((t) =>
                t.id === id
                    ? {
                          ...t,
                          isRunning: false,
                          result,
                      }
                    : t
            )
        );

        setHistory((h) => [
            {
                id: Date.now(),
                query: tab.query,
                time: new Date().toLocaleTimeString(),
                duration: `${data.executionTime} ms`,
                rows: result.totalRows,
                status: data.status ? "success" : "error",
            },
            ...h,
        ]);

        setBottomPanel("results");

        setStatusMsg({
            text: data.status
                ? "Query executed successfully"
                : data.error,
            type: data.status ? "success" : "error",
        });

    } catch (err) {

        setTabs((ts) =>
            ts.map((t) =>
                t.id === id
                    ? {
                          ...t,
                          isRunning: false,
                      }
                    : t
            )
        );

        setStatusMsg({
            text: "Failed to connect to server.",
            type: "error",
        });

    }

    setTimeout(() => setStatusMsg(null), 3000);
};

  // ── Editor actions ───────────────────────────────────────────────────────────

  const handleFormat = () => setTabQuery(activeTab, formatSQL(currentTab.query));

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTab.query).catch(() => {});
    setStatusMsg({ text: "Query copied to clipboard", type: "info" });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  const handleClear = () => setTabQuery(activeTab, "");

  const insertText = (text: string) =>
    setTabQuery(
      activeTab,
      currentTab.query +
        (currentTab.query.endsWith(" ") || !currentTab.query ? "" : " ") +
        text
    );

  // ── Panel resize ─────────────────────────────────────────────────────────────

  const onResizeMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = editorHeight;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const el = document.getElementById("main-col");
      if (!el) return;
      const total = el.getBoundingClientRect().height;
      const delta = e.clientY - dragStartY.current;
      setEditorHeight(
        Math.min(75, Math.max(18, dragStartH.current + (delta / total) * 100))
      );
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // ── Render ───────────────────────────────────────────────────────────────────

  // Show database selector first if no DB chosen yet
  if (!selectedDb) {
    return (
      <>
        <DatabaseSelector
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onConnect={(conn) => setSelectedDb(conn)}
        />
      </>
    );
  }

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: "var(--background)" }}
    >

      {/* ── Top Bar ── */}
      <header
        className="flex items-center gap-3 px-4 h-12 shrink-0 z-20"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="flex flex-col leading-none">
            <span
              className="text-md"
              style={{
                color: primaryColor,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              SQL Playground
            </span>
          </div>
        </div>

        <div className="w-px h-6" style={{ background: "var(--border)" }} />

        {/* Connection badge */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: "rgba(61,214,140,0.08)",
              border: "1px solid rgba(61,214,140,0.2)",
              color: "#3dd68c",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#3dd68c" }}
            />
            <span style={{ color: "var(--muted-foreground)" }}>
              {selectedDb.name}
            </span>
            <span>·</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#3dd68c" }}>
              {selectedDb.template}
            </span>
          </div>
        </div>

        <div className="flex-1" />
        {/* Icon actions */}
        <div className="flex items-center gap-0.5">
          {[
            {
              icon: <LayoutPanelLeft size={15} />,
              active: sidebarOpen,
              action: () => setSidebarOpen((s) => !s),
              title: "Toggle sidebar",
            },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              title={btn.title}
              className="p-2 rounded-lg transition-colors"
              style={{
                background: btn.active ? "var(--accent)" : "transparent",
                color: btn.active ? primaryColor : "var(--muted-foreground)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = btn.active ? "var(--accent)" : "transparent")
              }
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Schema Sidebar */}
        <aside
          className="shrink-0 overflow-hidden flex flex-col transition-all duration-200"
          style={{
            width: sidebarOpen ? "248px" : "0px",
            borderRight: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          {sidebarOpen && <SchemaSidebar onInsert={insertText} template={selectedDb.template} />}
        </aside>

        {/* Center column */}
        <div id="main-col" className="flex-1 flex flex-col overflow-hidden">

          {/* Tabs */}
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            primaryColor={primaryColor}
            onSelect={setActiveTab}
            onAdd={addTab}
            onClose={closeTab}
          />

          {/* Editor */}
          <div
            style={{
              height: `${editorHeight}%`,
              overflow: "hidden",
              background: "var(--background)",
            }}
          >
            <EditorToolbar
              primaryColor={primaryColor}
              primaryGradient={`linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} 100%)`}
              isRunning={currentTab?.isRunning ?? false}
              charCount={currentTab?.query.length ?? 0}
              lineCount={currentTab?.query.split("\n").length ?? 0}
              onRun={() => runQuery(activeTab)}
              onFormat={handleFormat}
              onCopy={handleCopy}
              onClear={handleClear}
            />
            <div
              className="overflow-hidden"
              style={{ height: "calc(100% - 44px)", background: "var(--background)" }}
            >
              {currentTab && (
                <SQLEditor
    value={currentTab.query}
    onChange={(v) => {
        setTabQuery(activeTab, v);
        updateTabTitle(v, selectedDb.template);
    }}
    onRun={() => runQuery(activeTab)}
/>
              )}
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="shrink-0 flex items-center justify-center cursor-row-resize group"
            style={{
              height: "8px",
              background: "var(--card)",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
            onMouseDown={onResizeMouseDown}
          >
            <div
              className="w-14 h-0.5 rounded-full opacity-30 group-hover:opacity-100 transition-opacity"
              style={{ background: primaryColor }}
            />
          </div>

          {/* Bottom panel */}
          <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "var(--background)" }}>

            {/* Panel tabs */}
            <div
              className="flex items-center shrink-0 px-3"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
            >
              {(["results", "history"] as BottomPanel[]).map((panel) => (
                <button
                  key={panel}
                  onClick={() => setBottomPanel(panel)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs capitalize transition-colors border-b-2"
                  style={{
                    borderColor: bottomPanel === panel ? primaryColor : "transparent",
                    color: bottomPanel === panel ? primaryColor : "var(--muted-foreground)",
                    fontWeight: bottomPanel === panel ? 600 : 400,
                    marginBottom: "-1px",
                  }}
                >
                  {panel === "results" ? <BarChart2 size={12} /> : <History size={12} />}
                  {panel === "results" ? "Results" : "History"}
                  {panel === "results" &&
                    currentTab?.result &&
                    !currentTab.result.error && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-xs ml-1"
                        style={{
                          background: `rgba(${theme === "light" ? "15,157,138" : "108,99,255"},0.15)`,
                          color: primaryColor,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {currentTab.result.rows.length}
                      </span>
                    )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {bottomPanel === "results" && currentTab && (
                currentTab.isRunning ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div
                      className="w-10 h-10 rounded-full animate-spin"
                      style={{
                        border: "2px solid var(--muted)",
                        borderTopColor: primaryColor,
                      }}
                    />
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      Executing query…
                    </p>
                  </div>
                ) : currentTab.result ? (
                  <ResultsTable result={currentTab.result} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Terminal size={36} className="opacity-15" style={{ color: "var(--foreground)" }} />
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      Press{" "}
                      <kbd
                        className="px-1.5 py-0.5 rounded text-xs mx-1"
                        style={{
                          background: "var(--muted)",
                          fontFamily: "'JetBrains Mono', monospace",
                          color: primaryColor,
                        }}
                      >
                        ⌘↵
                      </kbd>
                      to run your query
                    </p>
                  </div>
                )
              )}

              {bottomPanel === "history" && (
                <HistoryPanel
                  history={history}
                  primaryColor={primaryColor}
                  onLoad={(item) => {
                    setTabQuery(activeTab, item.query);
                    setBottomPanel("results");
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
