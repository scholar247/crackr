'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, CircleAlert, CircleCheck, Copy, Download, Filter, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SQL_MAX_ROWS } from '@/lib/sql-playground/templates';
import type { QueryRun, SqlCell } from '@/lib/sql-playground/types';

const PAGE_SIZE = 100;

function cellClass(value: SqlCell) {
  if (value === null) return 'italic text-[var(--sql-null)]';
  if (typeof value === 'number') return 'text-[var(--sql-number)] tabular-nums';
  return 'text-foreground';
}

function compare(a: SqlCell, b: SqlCell) {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

function csvField(value: SqlCell) {
  if (value === null) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function StatusBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function Stat({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn('flex items-center gap-1.5 whitespace-nowrap', className)}>
      {children}
    </span>
  );
}

/** Rendered with key={run.id}, so sort/filter/page reset for every new run. */
export function ResultsTable({ run }: { run: QueryRun }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ col: number; dir: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const result = run.result;
  const rows = result?.rows;

  const filtered = useMemo(() => {
    if (!rows || !filter) return rows ?? [];
    const needle = filter.toLowerCase();
    return rows.filter((row) => row.some((c) => String(c ?? 'null').toLowerCase().includes(needle)));
  }, [rows, filter]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => sign * compare(a[sort.col], b[sort.col]));
  }, [filtered, sort]);

  if (run.error || !result) {
    return (
      <div className="flex h-full flex-col">
        <StatusBar>
          <Stat className="text-[var(--sql-err)]">
            <CircleAlert className="h-3.5 w-3.5" /> Error
          </Stat>
        </StatusBar>
        <div className="m-4 flex items-start gap-3 rounded-md border border-[var(--sql-err)]/30 bg-[var(--sql-err)]/5 p-4">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sql-err)]" />
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[var(--sql-err)]">
            {run.error ?? 'Query failed.'}
          </pre>
        </div>
      </div>
    );
  }

  const time = <Stat>{result.executionTimeMs} ms</Stat>;
  const statements = result.statementCount > 1 && (
    <Stat title="Results are shown for the last statement">{result.statementCount} statements · showing last</Stat>
  );

  if (!result.isQuery) {
    return (
      <div className="flex h-full flex-col">
        <StatusBar>
          <Stat className="text-[var(--sql-ok)]">
            <CircleCheck className="h-3.5 w-3.5" /> Success
          </Stat>
          {time}
          {statements}
        </StatusBar>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <CircleCheck className="h-8 w-8 text-[var(--sql-ok)]" />
          <p className="text-sm font-medium text-foreground">
            {result.changes > 0
              ? `${result.changes.toLocaleString()} row${result.changes === 1 ? '' : 's'} affected`
              : 'Statement executed'}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Changes only last for this run — every run starts from a fresh copy of the database. Add a SELECT after
            your statement to see its effect.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (col: number) => {
    setSort((s) => (s?.col !== col ? { col, dir: 'asc' } : s.dir === 'asc' ? { col, dir: 'desc' } : null));
    setPage(0);
  };

  const copyCell = (value: SqlCell, key: string) => {
    navigator.clipboard.writeText(value === null ? 'NULL' : String(value)).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied((k) => (k === key ? null : k)), 1200);
      },
      () => toast.error('Could not copy to clipboard'),
    );
  };

  const exportCSV = () => {
    const lines = [result.columns.map(csvField).join(','), ...sorted.map((r) => r.map(csvField).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <StatusBar>
        <Stat className="text-[var(--sql-ok)]">
          <CircleCheck className="h-3.5 w-3.5" />
          {filter ? `${filtered.length.toLocaleString()} / ` : ''}
          {result.rows.length.toLocaleString()} row{result.rows.length === 1 ? '' : 's'}
        </Stat>
        {time}
        {statements}
        {result.truncated && (
          <Stat className="text-warning">
            <TriangleAlert className="h-3.5 w-3.5" /> Showing first {SQL_MAX_ROWS.toLocaleString()} rows — add a LIMIT
          </Stat>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="flex h-7 w-52 items-center gap-1.5 rounded border border-border bg-muted px-2">
            <Filter className="h-3 w-3 shrink-0" />
            <input
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Filter rows…"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
            />
            {filter && (
              <button type="button" onClick={() => setFilter('')} aria-label="Clear filter">
                <X className="h-3 w-3" />
              </button>
            )}
          </label>
          <Button variant="outline" size="sm" className="h-7" onClick={exportCSV} disabled={sorted.length === 0}>
            <Download className="!h-3 !w-3" /> CSV
          </Button>
        </div>
      </StatusBar>

      <div className="flex-1 overflow-auto">
        <table className="w-max min-w-full border-collapse font-mono text-xs">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
            <tr>
              <th className="w-12 border-r border-border px-2 py-2 text-center text-[10px] font-medium text-muted-foreground">
                #
              </th>
              {result.columns.map((col, i) => (
                <th key={i} className="border-r border-border p-0 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort(i)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-foreground hover:bg-accent"
                  >
                    <span className={cn(sort?.col === i && 'text-primary')}>{col}</span>
                    <span className="ml-auto text-muted-foreground">
                      {sort?.col === i ? (
                        sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri} className="group/row border-b border-border hover:bg-accent/50">
                <td className="border-r border-border bg-muted/40 px-2 py-1.5 text-center text-[11px] tabular-nums text-muted-foreground">
                  {page * PAGE_SIZE + ri + 1}
                </td>
                {row.map((cell, ci) => {
                  const key = `${page}-${ri}-${ci}`;
                  const display = cell === null ? 'NULL' : String(cell);
                  return (
                    <td key={ci} className="group/cell relative max-w-80 border-r border-border px-3 py-1.5" title={display}>
                      <span className={cn('block truncate pr-4', cellClass(cell))}>{display}</span>
                      <button
                        type="button"
                        onClick={() => copyCell(cell, key)}
                        aria-label="Copy value"
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-muted p-0.5 opacity-0 transition-opacity hover:!opacity-100 group-hover/cell:opacity-60"
                      >
                        {copied === key ? <Check className="h-3 w-3 text-[var(--sql-ok)]" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {filter ? 'No rows match the filter.' : 'The query returned no rows.'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <span>
            {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE_SIZE, sorted.length).toLocaleString()} of{' '}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="px-1">
              {page + 1} / {totalPages}
            </span>
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
