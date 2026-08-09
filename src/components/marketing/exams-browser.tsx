'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Award, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExamCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  initials: string;
  stats: { mocks: string; pyp: string; mcqs: string };
}

export interface ProgramGroup {
  slug: string;
  name: string;
  exams: ExamCardData[];
}

const ALL = 'all';

export function ExamsBrowser({ groups }: { groups: ProgramGroup[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((g) => category === ALL || g.slug === category)
      .map((g) => ({
        ...g,
        exams: q ? g.exams.filter((e) => e.name.toLowerCase().includes(q)) : g.exams,
      }))
      .filter((g) => g.exams.length > 0);
  }, [groups, query, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 50+ competitive exams..."
          className="w-full rounded-lg border border-input bg-background py-3 pl-11 pr-4 text-body-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip label="All Exams" active={category === ALL} onClick={() => setCategory(ALL)} />
        {groups.map((g) => (
          <FilterChip key={g.slug} label={g.name} active={category === g.slug} onClick={() => setCategory(g.slug)} />
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-label-caps px-2 uppercase text-muted-foreground">Quick Jump</p>
              <nav className="mt-2 flex flex-col gap-0.5">
                {groups.map((g) => (
                  <button
                    key={g.slug}
                    type="button"
                    onClick={() => setCategory(g.slug)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm transition-colors',
                      category === g.slug ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', category === g.slug ? 'bg-secondary' : 'bg-border')}
                    />
                    {g.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="text-body-md mt-3 font-semibold text-foreground">Scholar247 Pro</h3>
              <p className="text-body-sm mt-1 text-muted-foreground">Unlock 10,000+ premium mock tests.</p>
              <Link
                href="/sign-in"
                className="mt-3 block rounded-lg border border-input py-2 text-center text-label-caps uppercase text-foreground transition-colors hover:bg-accent"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </aside>

        <div className="space-y-12">
          {visibleGroups.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">No exams match your search.</p>
          ) : (
            visibleGroups.map((group) => (
              <section key={group.slug} id={group.slug}>
                <h2 className="text-headline-lg text-foreground">{group.name}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.exams.map((exam, i) => (
                    <ExamCard key={exam.id} exam={exam} featured={i === 0} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-label-caps rounded-full border px-4 py-2 uppercase transition-colors',
        active ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function ExamCard({ exam, featured }: { exam: ExamCardData; featured: boolean }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-body-sm font-semibold',
            featured ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'
          )}
        >
          {exam.initials}
        </div>
        {featured && (
          <span className="text-label-caps rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 uppercase text-secondary">
            Updated 2026 Pattern
          </span>
        )}
      </div>

      <h3 className="text-body-lg mt-4 font-semibold text-foreground">{exam.name}</h3>
      {exam.description && <p className="text-body-sm mt-1 line-clamp-2 text-muted-foreground">{exam.description}</p>}

      <div className="mt-4 flex items-center gap-4">
        <Stat value={exam.stats.mocks} label="Mocks" />
        <Stat value={exam.stats.pyp} label="PYP" />
        <Stat value={exam.stats.mcqs} label="MCQs" />
      </div>

      <Link
        href={`/exams/${exam.slug}`}
        className={cn(
          'mt-5 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-all',
          featured
            ? 'bg-primary text-primary-foreground hover:brightness-110'
            : 'border border-input text-foreground hover:bg-accent'
        )}
      >
        {featured ? 'Start Free Practice' : 'View Details'}
        {featured && <ArrowRight className="h-3.5 w-3.5" />}
      </Link>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-body-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
