'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Network, Search } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export interface IndexSubject {
  id: string;
  name: string;
  href: string;
  totalChapters: number;
  chapters: { id: string; name: string; href: string; topicCount: number; intro: string | null }[];
}

// Subject → chapter list of published mind maps with a search box. The full list is
// rendered on the server (crawlable); searching only hides non-matching cards.
export function MindMapIndex({ subjects, classLabel, analyticsExam }: { subjects: IndexSubject[]; classLabel: string; analyticsExam: string }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = subjects
    .map((s) => ({ ...s, chapters: q ? s.chapters.filter((c) => c.name.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) : s.chapters }))
    .filter((s) => s.chapters.length > 0);
  const total = subjects.reduce((n, s) => n + s.chapters.length, 0);

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => q.length >= 2 && trackEvent('mindmap_search_used', { exam: analyticsExam, scope: 'index' })}
          placeholder={`Search ${total} ${classLabel} mind maps by chapter or subject`}
          aria-label="Search mind maps by chapter or subject"
          className="h-11 w-full rounded-xl border border-border bg-card pr-3 pl-9 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-body-sm mt-6 text-muted-foreground" aria-live="polite">
          No mind maps match “{query}”.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {filtered.map((s) => (
            <section key={s.id} aria-labelledby={`mm-${s.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`mm-${s.id}`} className="text-headline-md text-foreground">
                  <Link href={s.href} className="hover:text-primary">
                    {classLabel} {s.name} mind maps
                  </Link>
                </h2>
                <span className="text-xs text-muted-foreground">
                  {s.chapters.length} of {s.totalChapters} chapters available
                </span>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.chapters.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={c.href}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Network className="h-4 w-4 text-primary" aria-hidden /> {c.topicCount} topic{c.topicCount === 1 ? '' : 's'}
                      </span>
                      <span className="mt-2 font-semibold text-foreground group-hover:text-primary">{c.name} mind map</span>
                      {c.intro && <span className="text-body-sm mt-1 line-clamp-2 text-muted-foreground">{c.intro}</span>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-primary">
                        Open mind map <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
