'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SamplePaperCard, type SubjectCardPaper } from './sample-paper-card';

/**
 * Grid of subject cards. With `searchable`, a filter box appears once there are enough
 * subjects to need one (CBSE 12 has dozens). Every card is in the server-rendered HTML;
 * the filter only hides cards, so crawlers still see every link.
 */
export function SamplePaperGrid({ examSlug, papers, searchable = false }: { examSlug: string; papers: SubjectCardPaper[]; searchable?: boolean }) {
  const [query, setQuery] = useState('');
  const showSearch = searchable && papers.length > 8;
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (q ? papers.filter((p) => p.subject.toLowerCase().includes(q)) : papers), [papers, q]);

  return (
    <div>
      {showSearch && (
        <div className="relative mb-5 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${papers.length} subjects…`} className="rounded-full pr-9 pl-9" aria-label="Search subjects" />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {papers.map((p) => (
          <li key={p.id} hidden={!visible.includes(p)}>
            <SamplePaperCard examSlug={examSlug} paper={p} />
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="text-body-md rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
          No subject matches “{query}”.{' '}
          <button type="button" onClick={() => setQuery('')} className="font-medium text-primary hover:underline">
            Show all
          </button>
        </p>
      )}
    </div>
  );
}

