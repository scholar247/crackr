'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExplorerTopic {
  id: string;
  name: string;
  subjectName: string;
  questionCount: number;
}

// Illustrative — no attempt-tracking is wired yet, cycled purely for visual variety.
const ACCURACY_CYCLE = [42, 92, 38, 71, 85];

interface TopicExplorerProps {
  subjects: string[];
  topics: ExplorerTopic[];
  examSlug: string;
  loggedIn: boolean;
}

const ALL = 'All Subjects';

export function TopicExplorer({ subjects, topics, examSlug, loggedIn }: TopicExplorerProps) {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(ALL);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter(
      (t) => (subjectFilter === ALL || t.subjectName === subjectFilter) && (!q || t.name.toLowerCase().includes(q))
    );
  }, [topics, query, subjectFilter]);

  if (topics.length === 0) return null;

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Topic Explorer</h2>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <FilterChip label={ALL} active={subjectFilter === ALL} onClick={() => setSubjectFilter(ALL)} />
            {subjects.map((s) => (
              <FilterChip key={s} label={s} active={subjectFilter === s} onClick={() => setSubjectFilter(s)} />
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics…"
              className="text-body-sm w-56 rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {visible.length === 0 ? (
            <p className="text-body-sm p-6 text-muted-foreground">No topics match your search.</p>
          ) : (
            visible.slice(0, 8).map((topic, i) => {
              const accuracy = ACCURACY_CYCLE[i % ACCURACY_CYCLE.length];
              return (
                <div key={topic.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary">{topic.subjectName}</span>
                    <p className="text-body-md font-medium text-foreground">{topic.name}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    {loggedIn ? (
                      <>
                        <Stat value={`${accuracy}%`} label="Accuracy" tone={accuracy < 50 ? 'text-destructive' : 'text-secondary'} />
                        <Stat value={`${Math.min(accuracy, topic.questionCount)} / ${topic.questionCount}`} label="Questions" />
                      </>
                    ) : (
                      <Stat value={`${topic.questionCount}`} label="Questions" />
                    )}
                    <Link
                      href={`/practice/exams/${examSlug}/questions`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20"
                      aria-label={`Practice ${topic.name}`}
                    >
                      {loggedIn && accuracy >= 90 ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {visible.length > 8 && (
          <div className="mt-4 text-center">
            <Link
              href={`/practice/exams/${examSlug}/questions`}
              className={cn('text-label-caps uppercase tracking-wider text-primary hover:text-primary/80')}
            >
              View All {topics.length} Topics
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-label-caps rounded-full border px-3 py-1.5 uppercase transition-colors',
        active ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div className="text-right">
      <p className={cn('text-body-sm font-semibold', tone ?? 'text-foreground')}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
