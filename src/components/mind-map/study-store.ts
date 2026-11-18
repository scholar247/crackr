'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { review, type Grade, type SrsCard } from '@/lib/spaced-repetition';

// Per-visitor study progress for one map, kept on the device (like explored nodes and quiz
// results): spaced-repetition state per node and starred nodes. No sign-in needed.

export interface StudyState {
  cards: Readonly<Record<string, SrsCard>>;
  starred: ReadonlySet<string>;
}

const EMPTY: StudyState = { cards: {}, starred: new Set() };
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: StudyState }>();

function read(key: string): StudyState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as { cards?: Record<string, SrsCard>; starred?: string[] }) : {};
    value = { cards: parsed.cards ?? {}, starred: new Set(parsed.starred ?? []) };
  } catch {
    value = EMPTY;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: StudyState) {
  try {
    localStorage.setItem(key, JSON.stringify({ cards: value.cards, starred: [...value.starred] }));
  } catch {
    return;
  }
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function useStudyState(storageKey: string | undefined) {
  const key = `mindmap-study:${storageKey ?? 'preview'}`;
  const state = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);

  const grade = useCallback(
    (id: string, g: Grade, today: number) => {
      const current = read(key);
      write(key, { ...current, cards: { ...current.cards, [id]: review(current.cards[id], g, today) } });
    },
    [key],
  );
  const toggleStar = useCallback(
    (id: string) => {
      const current = read(key);
      const starred = new Set(current.starred);
      if (starred.has(id)) starred.delete(id);
      else starred.add(id);
      write(key, { ...current, starred });
      return starred.has(id);
    },
    [key],
  );
  const reset = useCallback(() => write(key, { cards: {}, starred: read(key).starred }), [key]);

  return { state, grade, toggleStar, reset };
}
