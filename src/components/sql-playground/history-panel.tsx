'use client';

import { CircleAlert, CircleCheck, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HistoryItem } from '@/lib/sql-playground/types';

interface Props {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onClear: () => void;
}

export function HistoryPanel({ history, onLoad, onClear }: Props) {
  if (history.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No queries run yet.</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-xs text-muted-foreground">
        <span>Click a query to open it in the editor</span>
        <Button variant="ghost" size="sm" className="h-7" onClick={onClear}>
          <Trash2 className="!h-3 !w-3" /> Clear
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onLoad(item)}
            className="flex w-full flex-col gap-1 border-b border-border px-4 py-2.5 text-left hover:bg-accent/60"
          >
            <div className="flex items-start gap-2">
              {item.status === 'success' ? (
                <CircleCheck className="mt-0.5 h-3 w-3 shrink-0 text-[var(--sql-ok)]" />
              ) : (
                <CircleAlert className="mt-0.5 h-3 w-3 shrink-0 text-[var(--sql-err)]" />
              )}
              <span className="flex-1 truncate font-mono text-xs text-foreground">{item.query.replace(/\s+/g, ' ').trim()}</span>
            </div>
            <div className="flex items-center gap-3 pl-5 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.durationMs} ms
              </span>
              {item.status === 'success' && <span>{item.rows.toLocaleString()} rows</span>}
              <span className="ml-auto">{item.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
