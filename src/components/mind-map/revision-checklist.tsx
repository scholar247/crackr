'use client';

import { useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// "I've revised this" per topic, saved on the visitor's device (no account needed) — the
// quick-revision progress for a chapter.

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; set: Set<string> }>();
const EMPTY = new Set<string>();

function read(key: string): Set<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.set;
  let set: Set<string>;
  try {
    set = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    set = new Set();
  }
  cache.set(key, { raw, set });
  return set;
}

function toggle(key: string, id: string) {
  const next = new Set(read(key));
  if (next.has(id)) next.delete(id);
  else next.add(id);
  try {
    localStorage.setItem(key, JSON.stringify([...next]));
  } catch {
    return;
  }
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function RevisionChecklist({ storageKey, topics }: { storageKey: string; topics: { id: string; label: string; subtopics: number }[] }) {
  const done = useSyncExternalStore(subscribe, () => read(storageKey), () => EMPTY);
  const count = topics.filter((t) => done.has(t.id)).length;
  const pct = topics.length ? Math.round((count / topics.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-foreground">Revision checklist</p>
        <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {count}/{topics.length} revised
        </span>
      </div>
      <Progress value={pct} className="mt-3 h-2" aria-label={`${pct}% of topics revised`} />
      <ul className="mt-4 space-y-1.5">
        {topics.map((t) => {
          const checked = done.has(t.id);
          return (
            <li key={t.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(storageKey, t.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted/50"
              >
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border')}>
                  {checked && <Check className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <span className={cn('flex-1', checked ? 'text-muted-foreground line-through' : 'text-foreground')}>{t.label}</span>
                {t.subtopics > 0 && <span className="text-xs text-muted-foreground">{t.subtopics} subtopics</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">Saved on this device.</p>
    </div>
  );
}
