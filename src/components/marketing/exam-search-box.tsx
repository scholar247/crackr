'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, LayoutGrid } from 'lucide-react';
import { fuzzyMatch } from '@/lib/fuzzy-search';
import { cn } from '@/lib/utils';

interface SearchableExam {
  type: 'exam';
  id: string;
  slug: string;
  name: string;
  programName: string;
}
interface SearchableProgram {
  type: 'program';
  id: string;
  slug: string;
  name: string;
}
type SearchableItem = SearchableExam | SearchableProgram;

export interface ExamSearchBoxProps {
  q?: string;
  exams: { id: string; slug: string; name: string; programName: string }[];
  programs: { id: string; slug: string; name: string }[];
  className?: string;
}

const MIN_QUERY_LENGTH = 3;

// The form still does a plain GET submit to /exams?q=... on Enter (drives the Popular
// Exams grid on /exams, no client JS required for that path) — the dropdown here is an
// additive live-typeahead layer on top, matched entirely against the exam/program list
// the server page already fetched (no extra request per keystroke). Shared by the /exams
// hero and the homepage hero.
export function ExamSearchBox({ q, exams, programs, className }: ExamSearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q ?? '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items: SearchableItem[] = useMemo(
    () => [...programs.map((p) => ({ type: 'program' as const, ...p })), ...exams.map((e) => ({ type: 'exam' as const, ...e }))],
    [exams, programs],
  );

  const trimmed = query.trim();
  const results =
    trimmed.length >= MIN_QUERY_LENGTH
      ? fuzzyMatch(items, trimmed, (item) => (item.type === 'exam' ? `${item.name} ${item.programName}` : item.name), 8)
      : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(item: SearchableItem) {
    setOpen(false);
    setQuery(item.name);
    router.push(item.type === 'program' ? `/exams?program=${item.slug}` : `/exams/${item.slug}`);
  }

  return (
    <div ref={containerRef} className={cn('relative mx-auto max-w-xl text-left', className)}>
      <form action="/exams" method="GET" className="flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.trim().length >= MIN_QUERY_LENGTH);
          }}
          onFocus={() => setOpen(trimmed.length >= MIN_QUERY_LENGTH)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search exams by name, program, or goal..."
          className="text-body-sm w-full bg-transparent px-1 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          className="text-label-caps shrink-0 rounded-xl bg-foreground px-6 py-2.5 uppercase tracking-wider text-background transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      {open && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => goTo(item)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
            >
              <span
                className={
                  item.type === 'program'
                    ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'
                    : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary'
                }
              >
                {item.type === 'program' ? <LayoutGrid className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-body-sm block truncate font-medium text-foreground">{item.name}</span>
                {item.type === 'exam' && <span className="block truncate text-xs text-muted-foreground">{item.programName}</span>}
              </span>
              <span className="text-[10px] shrink-0 uppercase tracking-wide text-muted-foreground">{item.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
