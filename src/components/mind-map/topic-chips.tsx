'use client';

import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colourFor } from './palette';

export interface TopicChip {
  id: string;
  label: string;
  branch: number;
  done: number;
  total: number;
}

// One-tap navigation across a chapter's main topics: "All" returns to the overview, a topic
// opens just that branch. Each chip shows how much of its branch is done (explored, or
// recalled in a quiz). Scrolls sideways on narrow screens.
export function TopicChips({ topics, activeId, onSelect, progressLabel }: { topics: TopicChip[]; activeId: string | null; onSelect: (id: string | null) => void; progressLabel: string }) {
  if (topics.length < 2) return null;
  return (
    <nav aria-label="Jump to a topic" className="border-b border-border bg-card/80 backdrop-blur">
      <ul className="flex gap-2 overflow-x-auto px-3 py-2.5 [&::-webkit-scrollbar]:hidden">
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={activeId === null}
            className={cn(
              'flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
              activeId === null ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:border-primary/40',
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden /> All topics
          </button>
        </li>
        {topics.map((t) => {
          const colour = colourFor(t.branch);
          const active = activeId === t.id;
          const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
          return (
            <li key={t.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                aria-pressed={active}
                aria-label={`${t.label}, ${t.done} of ${t.total} ${progressLabel}`}
                className={cn(
                  'relative flex h-10 max-w-[15rem] items-center gap-2 overflow-hidden rounded-full border-2 px-3.5 text-sm font-medium transition-all',
                  active ? cn(colour.topic, 'shadow-sm') : 'border-border bg-background text-foreground hover:border-primary/40',
                )}
              >
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colour.dot)} aria-hidden />
                <span className="truncate">{t.label}</span>
                {t.done > 0 && <span className="shrink-0 text-[11px] tabular-nums opacity-70">{pct}%</span>}
                {/* Progress along the bottom edge of the chip. */}
                <span className="absolute inset-x-3 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-current/10" aria-hidden>
                  <span className={cn('block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500', pct >= 100 ? 'bg-emerald-500' : colour.dot)} style={{ width: `${pct}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
