'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ListChecks, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { NimcetSubject } from '@/server/services/exam-landing/nimcet';

function matches(text: string, q: string) {
  return text.toLowerCase().includes(q);
}

// Subject → unit → topic, as disclosure buttons (keyboard and screen-reader friendly). A
// search narrows to matching topics and opens everything that matches, so a student looking
// for "Bayes" lands on it without knowing which unit it sits in.
export function NimcetSyllabusExplorer({ subjects, initiallyOpen = true }: { subjects: NimcetSubject[]; initiallyOpen?: boolean }) {
  const [query, setQuery] = useState('');
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(() => new Set(initiallyOpen && subjects[0] ? [subjects[0].slug] : []));
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return subjects;
    return subjects
      .map((s) => ({
        ...s,
        units: s.units
          .map((u) => (matches(u.name, q) ? u : { ...u, topics: u.topics.filter((t) => matches(t, q)) }))
          .filter((u) => u.topics.length > 0),
      }))
      .filter((s) => s.units.length > 0);
  }, [subjects, q]);

  const toggle = (set: Set<string>, key: string, update: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update(next);
  };
  const allOpen = openSubjects.size === subjects.length;
  const matchCount = filtered.reduce((n, s) => n + s.units.reduce((m, u) => m + u.topics.length, 0), 0);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, e.g. Bayes, syllogism"
            aria-label="Search the NIMCET syllabus"
            className="pl-9 pr-9"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {q ? (
          <p className="text-body-sm text-muted-foreground" aria-live="polite">
            {matchCount} matching topic{matchCount === 1 ? '' : 's'}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setOpenSubjects(allOpen ? new Set() : new Set(subjects.map((s) => s.slug)))}
            className="self-start text-sm font-semibold text-primary hover:underline sm:self-auto"
          >
            {allOpen ? 'Collapse all subjects' : 'Expand all subjects'}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-body-sm mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
          No topic matches “{query}”. Try a shorter word.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((s) => {
            const subjectOpen = !!q || openSubjects.has(s.slug);
            const panelId = `syl-${s.slug}`;
            return (
              <li key={s.slug} className="overflow-hidden rounded-2xl border border-border bg-card">
                <h3>
                  <button
                    type="button"
                    aria-expanded={subjectOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(openSubjects, s.slug, setOpenSubjects)}
                    disabled={!!q}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{s.name}</span>
                      <span className="text-body-sm text-muted-foreground">
                        Part {s.part} · {s.questions} questions · {s.units.length} units
                        {s.progress && <> · your mock average {Math.round(s.progress.avgPercentage)}%</>}
                      </span>
                    </span>
                    <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', subjectOpen && 'rotate-180')} aria-hidden />
                  </button>
                </h3>

                {subjectOpen && (
                  <div id={panelId} className="border-t border-border">
                    <ul className="divide-y divide-border">
                      {s.units.map((u) => {
                        const key = `${s.slug}/${u.slug}`;
                        const unitOpen = !!q || openUnits.has(key);
                        const unitPanel = `syl-${s.slug}-${u.slug}`;
                        return (
                          <li key={u.slug}>
                            <div className="flex flex-wrap items-center gap-2 px-5 py-3">
                              <button
                                type="button"
                                aria-expanded={unitOpen}
                                aria-controls={unitPanel}
                                onClick={() => toggle(openUnits, key, setOpenUnits)}
                                disabled={!!q}
                                className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !unitOpen && '-rotate-90')} aria-hidden />
                                <span className="font-medium text-foreground">{u.name}</span>
                                <span className="text-body-sm text-muted-foreground">
                                  · {u.topics.length} topic{u.topics.length === 1 ? '' : 's'}
                                  {u.questionCount > 0 && ` · ${u.questionCount} Qs`}
                                </span>
                              </button>
                              <div className="flex gap-3 text-sm">
                                {u.practiceHref && (
                                  <Link href={u.practiceHref} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                                    <ListChecks className="h-4 w-4" aria-hidden /> Practise
                                  </Link>
                                )}
                                <Link href={u.href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                                  Study unit <span className="sr-only">{u.name}</span>
                                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                </Link>
                              </div>
                            </div>
                            {unitOpen && (
                              <ul id={unitPanel} className="grid gap-1.5 px-5 pb-4 pl-11 sm:grid-cols-2">
                                {u.topics.map((t) => (
                                  <li key={t} className="text-body-sm flex gap-2 text-muted-foreground">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="border-t border-border bg-muted/30 px-5 py-3">
                      <Link href={s.href} className="text-sm font-semibold text-primary hover:underline">
                        Open the {s.name} page →
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
