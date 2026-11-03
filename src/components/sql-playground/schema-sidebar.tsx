'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, KeyRound, Link2, LoaderCircle, Play, RefreshCw, Search, Table2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SqlSchemaTable } from '@/lib/sql-playground/types';

interface Props {
  template: string;
  /** Insert a table/column name at the editor's cursor. */
  onInsert: (text: string) => void;
  /** Replace the editor with a query and run it. */
  onPreview: (sql: string) => void;
}

async function fetchSchema(template: string): Promise<SqlSchemaTable[]> {
  const res = await fetch(`/api/v1/sql-playground/schema?template=${encodeURIComponent(template)}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? 'Could not load the schema.');
  return body.data;
}

const quoteIdent = (name: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`);

export function SchemaSidebar({ template, onInsert, onPreview }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const { data: tables = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['sql-playground', 'schema', template],
    queryFn: () => fetchSchema(template),
    staleTime: Infinity,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => t.name.toLowerCase().includes(q) || t.columns.some((c) => c.name.toLowerCase().includes(q)));
  }, [tables, search]);

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Schema</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Reload schema"
        >
          {isFetching ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="shrink-0 p-2">
        <label className="flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1.5">
          <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search tables, columns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
          </div>
        ) : error ? (
          <p className="px-2 py-4 text-xs text-[var(--sql-err)]">{(error as Error).message}</p>
        ) : tables.length === 0 ? (
          <p className="px-2 py-4 text-xs leading-relaxed text-muted-foreground">
            No tables yet. Try <code className="font-mono text-foreground">CREATE TABLE</code> — and add a SELECT in the
            same run to see it.
          </p>
        ) : (
          <>
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tables ({filtered.length})
            </div>
            {filtered.map((table) => {
              // Searching for a column auto-expands the tables that contain it.
              const open = expanded.has(table.name) || (!!search && !table.name.toLowerCase().includes(search.toLowerCase()));
              return (
                <div key={table.name}>
                  <div className="group flex items-center rounded hover:bg-accent">
                    <button
                      type="button"
                      onClick={() => toggle(table.name)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1.5 text-left"
                    >
                      {open ? (
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <Table2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate font-mono text-xs text-foreground">{table.name}</span>
                      <span className="ml-auto pl-1 font-mono text-[10px] text-muted-foreground">{table.rowCount.toLocaleString()}</span>
                    </button>
                    <button
                      type="button"
                      title={`SELECT * FROM ${table.name} LIMIT 50`}
                      aria-label={`Preview ${table.name}`}
                      onClick={() => onPreview(`SELECT *\nFROM ${quoteIdent(table.name)}\nLIMIT 50;\n`)}
                      className="mr-1 rounded p-1 text-muted-foreground opacity-0 hover:bg-background hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  </div>

                  {open && (
                    <div className="mb-1 ml-4 border-l border-border pl-1.5">
                      <button
                        type="button"
                        onClick={() => onInsert(quoteIdent(table.name))}
                        className="w-full rounded px-2 py-1 text-left text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        Insert table name
                      </button>
                      {table.columns.map((column) => (
                        <button
                          type="button"
                          key={column.name}
                          onClick={() => onInsert(quoteIdent(column.name))}
                          title={column.references ? `References ${column.references}` : undefined}
                          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left hover:bg-accent"
                        >
                          {column.primaryKey ? (
                            <KeyRound className="h-3 w-3 shrink-0 text-warning" />
                          ) : column.references ? (
                            <Link2 className="h-3 w-3 shrink-0 text-[var(--sql-fn)]" />
                          ) : (
                            <span className="h-3 w-3 shrink-0" />
                          )}
                          <span className={cn('truncate font-mono text-xs text-foreground', column.primaryKey && 'font-semibold')}>
                            {column.name}
                          </span>
                          <span className="ml-auto pl-1 font-mono text-[10px] uppercase text-muted-foreground">{column.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
