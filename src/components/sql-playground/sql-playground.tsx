'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronLeft, Database, History, PanelLeft, PanelLeftClose, Rows3, TerminalSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { cn } from '@/lib/utils';
import { formatSQL } from '@/lib/sql-playground/highlight';
import type { SqlTemplate } from '@/lib/sql-playground/templates';
import type { BottomPanel, HistoryItem, QueryRun, SqlExecuteResult, Tab } from '@/lib/sql-playground/types';
import { EditorToolbar } from './editor-toolbar';
import { HistoryPanel } from './history-panel';
import { ResultsTable } from './results-table';
import { SchemaSidebar } from './schema-sidebar';
import { SqlEditor, type SqlEditorHandle } from './sql-editor';
import { TabBar } from './tab-bar';

const MAX_HISTORY = 50;
const STORAGE_VERSION = 1;

const defaultQuery = (template: SqlTemplate) =>
  template.id === 'blank'
    ? `-- ${template.name}: every run starts from an empty database,\n-- so create and query your tables in the same run.\nCREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT);\nINSERT INTO notes (body) VALUES ('Hello, SQL!');\nSELECT * FROM notes;\n`
    : `-- ${template.name} database\n-- Tip: press ▶ next to a table in the sidebar to preview it.\nSELECT name\nFROM sqlite_schema\nWHERE type = 'table'\nORDER BY name;\n`;

const newTab = (id: string, title: string, query: string): Tab => ({ id, title, query, run: null, isRunning: false });

interface Stored {
  v: number;
  tabs: { id: string; title: string; query: string }[];
  activeTab: string;
  history: HistoryItem[];
}

// Work survives a refresh: tabs and history are kept per database in localStorage.
// Storage can be missing or throw (private mode, blocked cookies), so it's best-effort.
function loadStored(key: string): Stored | null {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    return parsed?.v === STORAGE_VERSION && Array.isArray(parsed.tabs) && parsed.tabs.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

async function executeRemote(template: string, sql: string): Promise<SqlExecuteResult> {
  const res = await fetch('/api/v1/sql-playground/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, sql }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status}).`);
  return body.data;
}

const noopSubscribe = () => () => {};

/**
 * The workspace depends on browser-only state (saved tabs, platform, screen width), so it
 * renders on the client only; the server sends a placeholder of the same size.
 */
export function SqlPlayground({ template }: { template: SqlTemplate }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading SQL Playground…
      </div>
    );
  }
  return <Workspace key={template.id} template={template} />;
}

function Workspace({ template }: { template: SqlTemplate }) {
  const storageKey = `sql-playground:${template.id}`;

  const [stored] = useState(() => loadStored(storageKey));
  const [tabs, setTabs] = useState<Tab[]>(() =>
    stored ? stored.tabs.map((t) => newTab(t.id, t.title, t.query)) : [newTab('1', 'Query 1', defaultQuery(template))],
  );
  const [activeTab, setActiveTab] = useState(() =>
    stored?.tabs.some((t) => t.id === stored.activeTab) ? stored.activeTab : tabs[0].id,
  );
  const [history, setHistory] = useState<HistoryItem[]>(() => stored?.history ?? []);
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('results');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [editorHeight, setEditorHeight] = useState(50);
  const modKey = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

  const editorRef = useRef<SqlEditorHandle>(null);
  const mainColRef = useRef<HTMLDivElement>(null);
  const runCounter = useRef(0);
  // Latest tabs for async callbacks, so a run always reads the query as it is now.
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  useEffect(() => {
    const data: Stored = {
      v: STORAGE_VERSION,
      tabs: tabs.map(({ id, title, query }) => ({ id, title, query })),
      activeTab,
      history: history.slice(0, MAX_HISTORY),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Best-effort; see loadStored.
    }
  }, [storageKey, tabs, activeTab, history]);

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const addTab = () => {
    const id = String(Date.now());
    setTabs((ts) => {
      const used = new Set(ts.map((t) => t.title));
      let n = ts.length + 1;
      while (used.has(`Query ${n}`)) n++;
      return [...ts, newTab(id, `Query ${n}`, '')];
    });
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (activeTab === id) setActiveTab(next[Math.max(0, idx - 1)].id);
  };

  const runQuery = useCallback(
    async (id: string, sqlOverride?: string | null) => {
      const tab = tabsRef.current.find((t) => t.id === id);
      if (!tab || tab.isRunning) return;
      const sql = sqlOverride ?? tab.query;
      if (!sql.trim()) {
        toast.info('Write a query first.');
        return;
      }

      updateTab(id, { isRunning: true });
      setBottomPanel('results');

      let run: QueryRun;
      const started = performance.now();
      try {
        const result = await executeRemote(template.id, sql);
        run = { id: ++runCounter.current, result, error: null };
      } catch (err) {
        run = { id: ++runCounter.current, result: null, error: err instanceof Error ? err.message : 'Query failed.' };
      }

      updateTab(id, { isRunning: false, run });
      setHistory((h) =>
        [
          {
            id: Date.now(),
            query: sql,
            time: new Date().toLocaleTimeString(),
            durationMs: run.result?.executionTimeMs ?? Math.round(performance.now() - started),
            rows: run.result ? (run.result.isQuery ? run.result.rows.length : run.result.changes) : 0,
            status: run.error ? ('error' as const) : ('success' as const),
          },
          ...h,
        ].slice(0, MAX_HISTORY),
      );
    },
    [template.id, updateTab],
  );

  const runActive = (selection?: string | null) =>
    runQuery(activeTab, selection === undefined ? editorRef.current?.getSelection() : selection);

  const handleFormat = () => updateTab(activeTab, { query: formatSQL(currentTab.query) });

  const handleCopy = () =>
    navigator.clipboard.writeText(currentTab.query).then(
      () => toast.success('Query copied'),
      () => toast.error('Could not copy to clipboard'),
    );

  const handlePreview = (sql: string) => {
    updateTab(activeTab, { query: sql });
    runQuery(activeTab, sql);
  };

  // Drag the divider between editor and results.
  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const col = mainColRef.current;
    if (!col) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startH = editorHeight;
    const total = col.getBoundingClientRect().height;

    const onMove = (ev: PointerEvent) => {
      setEditorHeight(Math.min(80, Math.max(15, startH + ((ev.clientY - startY) / total) * 100)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const resultCount = currentTab.run?.result?.isQuery ? currentTab.run.result.rows.length : null;

  return (
    <div className="sql-playground flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-2 sm:px-3">
        <Link
          href="/sql-playground"
          className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          title="All databases"
        >
          <ChevronLeft className="h-4 w-4" />
          <TerminalSquare className="h-4 w-4 text-primary" />
          <span className="hidden font-semibold text-foreground sm:inline">SQL Playground</span>
        </Link>

        <div className="h-5 w-px bg-border" />

        <div className="flex min-w-0 items-center gap-1.5 rounded border border-border bg-muted px-2.5 py-1 text-xs">
          <Database className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate font-medium">{template.name}</span>
          <span className="hidden text-muted-foreground sm:inline">· SQLite</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={sidebarOpen ? 'Hide schema' : 'Show schema'}
            title={sidebarOpen ? 'Hide schema' : 'Show schema'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'shrink-0 overflow-hidden border-border bg-card transition-[width] duration-200',
            sidebarOpen ? 'w-64 border-r' : 'w-0',
          )}
        >
          <div className="h-full w-64">
            <SchemaSidebar
              template={template.id}
              onInsert={(text) => editorRef.current?.insert(text)}
              onPreview={handlePreview}
            />
          </div>
        </aside>

        <div ref={mainColRef} className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TabBar
            tabs={tabs}
            activeTab={currentTab.id}
            onSelect={setActiveTab}
            onAdd={addTab}
            onClose={closeTab}
            onRename={(id, title) => updateTab(id, { title })}
          />

          <div className="flex flex-col overflow-hidden" style={{ height: `${editorHeight}%` }}>
            <EditorToolbar
              isRunning={currentTab.isRunning}
              lineCount={currentTab.query.split('\n').length}
              charCount={currentTab.query.length}
              modKey={modKey}
              onRun={() => runActive()}
              onFormat={handleFormat}
              onCopy={handleCopy}
              onClear={() => updateTab(activeTab, { query: '' })}
            />
            <div className="min-h-0 flex-1">
              <SqlEditor
                key={currentTab.id}
                ref={editorRef}
                value={currentTab.query}
                onChange={(query) => updateTab(currentTab.id, { query })}
                onRun={(selection) => runActive(selection)}
                onFormat={handleFormat}
              />
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editor"
            onPointerDown={onResizePointerDown}
            className="group flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center border-y border-border bg-card"
          >
            <div className="h-0.5 w-12 rounded-full bg-primary opacity-30 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center border-b border-border bg-card px-2">
              {(['results', 'history'] as const).map((panel) => (
                <button
                  type="button"
                  key={panel}
                  onClick={() => setBottomPanel(panel)}
                  className={cn(
                    '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs',
                    bottomPanel === panel
                      ? 'border-primary font-semibold text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {panel === 'results' ? <Rows3 className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
                  {panel === 'results' ? 'Results' : 'History'}
                  {panel === 'results' && resultCount !== null && (
                    <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[10px]">{resultCount}</span>
                  )}
                  {panel === 'history' && history.length > 0 && (
                    <span className="rounded-full bg-muted px-1.5 font-mono text-[10px]">{history.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {bottomPanel === 'history' ? (
                <HistoryPanel
                  history={history}
                  onLoad={(item) => {
                    updateTab(activeTab, { query: item.query });
                    setBottomPanel('results');
                  }}
                  onClear={() => setHistory([])}
                />
              ) : currentTab.isRunning ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  Running query…
                </div>
              ) : currentTab.run ? (
                <ResultsTable key={currentTab.run.id} run={currentTab.run} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <TerminalSquare className="h-7 w-7 opacity-30" />
                  <p>
                    Press{' '}
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-primary">{modKey}+Enter</kbd>{' '}
                    to run your query
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
