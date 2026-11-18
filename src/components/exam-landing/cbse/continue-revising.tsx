'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { History } from 'lucide-react';

export interface RevisableChapter {
  chapterId: string;
  chapter: string;
  subject: string;
  href: string;
}

// "Continue revising": chapters whose mind map this visitor has already opened on this
// device (progress the map keeps in localStorage), most-explored first. Personal, with no
// sign-in — and renders nothing for a first-time visitor or on the server.

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

export function ContinueRevising({ examSlug, chapters }: { examSlug: string; chapters: RevisableChapter[] }) {
  // A stable string snapshot ("id:count,id:count") so the store doesn't re-render needlessly.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return chapters
          .map((c) => {
            const raw = localStorage.getItem(`mindmap-explored:${examSlug}:${c.chapterId}`);
            const count = raw ? (JSON.parse(raw) as unknown[]).length : 0;
            return count > 0 ? `${c.chapterId}:${count}` : '';
          })
          .filter(Boolean)
          .join(',');
      } catch {
        return '';
      }
    },
    () => '',
  );
  if (!snapshot) return null;

  const counts = new Map(snapshot.split(',').map((p) => p.split(':') as [string, string]));
  const started = chapters
    .filter((c) => counts.has(c.chapterId))
    .sort((a, b) => Number(counts.get(b.chapterId)) - Number(counts.get(a.chapterId)))
    .slice(0, 6);

  return (
    <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 motion-safe:animate-in motion-safe:fade-in">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4 text-primary" aria-hidden /> Continue where you left off
      </p>
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {started.map((c) => (
          <li key={c.chapterId} className="shrink-0">
            <Link href={`${c.href}#mind-map`} className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm transition hover:border-primary/40 hover:text-primary">
              <span className="font-medium">{c.chapter}</span>
              <span className="text-xs text-muted-foreground">
                {c.subject} · {counts.get(c.chapterId)} explored
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
