'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileCheck2, History, ListChecks, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FinderExam {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  programSlug: string;
  programName: string;
  chapters: number;
  mcqs: number;
  pyqs: number;
  mockTests: number;
}

export interface FinderProgram {
  slug: string;
  name: string;
}

type Availability = 'all' | 'mcqs' | 'pyqs' | 'mockTests';

const AVAILABILITY_FILTERS: { key: Availability; label: string }[] = [
  { key: 'all', label: 'All exams' }
];

// Exams with more real content float to the top; ties fall back to name.
function richness(e: FinderExam) {
  return e.chapters + e.mcqs + e.pyqs * 2 + e.mockTests * 5;
}

function Stat({ icon: Icon, value, label, singular }: { icon: typeof BookOpen; value: number; label: string; singular: string }) {
  const has = value > 0;
  return (
    <div className={cn('flex items-center gap-2', !has && 'opacity-50')}>
      <Icon className={cn('h-4 w-4 shrink-0', has ? 'text-primary' : 'text-muted-foreground')} />
      <span className="text-body-sm text-foreground">
        {has ? (
          <>
            <span className="font-semibold tabular-nums">{value.toLocaleString('en-IN')}</span> {value === 1 ? singular : label}
          </>
        ) : (
          <span className="text-muted-foreground">{label} · soon</span>
        )}
      </span>
    </div>
  );
}

interface ExamFinderProps {
  programs: FinderProgram[];
  exams: FinderExam[];
  initialProgram?: string;
  /** Free-text search from the hero form (?q=). */
  q?: string;
}

// The page's main job: get the visitor to an exam. Program tabs narrow by goal, availability
// chips narrow by what they want to do (practice / PYQs / mocks), and each card shows what
// they'll actually get — real counts, not claims — with one obvious next step.
export function ExamFinder({ programs, exams, initialProgram, q }: ExamFinderProps) {
  const [program, setProgram] = useState(initialProgram ?? 'all');
  const [availability, setAvailability] = useState<Availability>('all');

  const countByProgram = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of exams) map.set(e.programSlug, (map.get(e.programSlug) ?? 0) + 1);
    return map;
  }, [exams]);

  const query = q?.trim().toLowerCase();
  const visible = useMemo(
    () =>
      exams
        .filter((e) => program === 'all' || e.programSlug === program)
        .filter((e) => availability === 'all' || e[availability] > 0)
        .filter((e) => !query || `${e.name} ${e.description ?? ''} ${e.programName}`.toLowerCase().includes(query))
        .sort((a, b) => richness(b) - richness(a) || a.name.localeCompare(b.name)),
    [exams, program, availability, query],
  );

  return (
    <section id="all-exams" className="scroll-mt-20 py-14 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-label-caps uppercase tracking-wider text-primary">Choose your exam</p>
            <h2 className="text-headline-lg mt-1 text-foreground">{query ? `Results for “${q?.trim()}”` : 'Browse exams by program'}</h2>
          </div>
          {query && (
            <Link href="/exams" className="text-body-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Clear search
            </Link>
          )}
        </div>

        {/* Program tabs */}
        <div role="tablist" aria-label="Programs" className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
          {[{ slug: 'all', name: 'All programs' }, ...programs].map((p) => {
            const active = program === p.slug;
            const count = p.slug === 'all' ? exams.length : (countByProgram.get(p.slug) ?? 0);
            return (
              <button
                key={p.slug}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setProgram(p.slug)}
                className={cn(
                  'text-body-sm flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:border-primary/40',
                )}
              >
                {p.name}
                <span
                  className={cn(
                    'text-label-caps rounded-full px-1.5 py-0.5',
                    active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Availability filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-body-sm text-muted-foreground">Show:</span>
          {AVAILABILITY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={availability === key}
              onClick={() => setAvailability(key)}
              className={cn(
                'text-label-caps rounded-full px-3 py-1 uppercase transition-colors',
                availability === key ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
          <span className="text-body-sm ml-auto text-muted-foreground">
            {visible.length} {visible.length === 1 ? 'exam' : 'exams'}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-body-md font-semibold text-foreground">No exams match those filters</p>
            <p className="text-body-sm mt-1 text-muted-foreground">Try another program, or clear the filters.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => {
                setProgram('all');
                setAvailability('all');
              }}
            >
              <X className="mr-1.5 h-4 w-4" /> Reset filters
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((exam) => (
              <article
                key={exam.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
              >
                <p className="text-label-caps uppercase tracking-wider text-primary">{exam.programName}</p>
                <h3 className="text-headline-md mt-1 text-foreground">{exam.name}</h3>
                <p className="text-body-sm mt-1.5 line-clamp-2 min-h-10 text-muted-foreground">
                  {exam.description?.trim() || 'Syllabus-mapped theory, practice and mocks.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-4">
                  <Stat icon={BookOpen} value={exam.chapters} label="Chapters" singular="Chapter" />
                  <Stat icon={ListChecks} value={exam.mcqs} label="MCQs" singular="MCQ" />
                  <Stat icon={History} value={exam.pyqs} label="PYQs" singular="PYQ" />
                  <Stat icon={FileCheck2} value={exam.mockTests} label="Mocks" singular="Mock" />
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Button className="flex-1 rounded-full" asChild>
                    <Link href={`/exams/${exam.slug}`}>
                      Explore exam <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  {exam.mcqs > 0 && (
                    <Button variant="outline" className="rounded-full" asChild>
                      <Link href={`/practice/exams/${exam.slug}`}>Practice</Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
