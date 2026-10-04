'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CheckCircle2, FileCheck2, ListChecks, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyPractice } from '@/components/marketing/home/daily-practice';
import type { ExamSpotlight, ExamSpotlightStats } from '@/server/repositories/exam-spotlight.repository';
import { cn } from '@/lib/utils';

export interface ExplorerExam {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ExplorerProgram {
  id: string;
  name: string;
  description: string | null;
  exams: ExplorerExam[];
}

interface ExamExplorerProps {
  programs: ExplorerProgram[];
  initialExamSlug: string;
  initialSpotlight: ExamSpotlight;
  initialProgramId: string;
  initialProgramStats: Record<string, ExamSpotlightStats>;
}

async function fetchProgramStats(programId: string): Promise<Record<string, ExamSpotlightStats>> {
  const res = await fetch(`/api/v1/public/home/exam-spotlight?program=${encodeURIComponent(programId)}`);
  if (!res.ok) throw new Error('Failed to load program');
  return (await res.json()).data;
}

async function fetchSpotlight(slug: string): Promise<ExamSpotlight> {
  const res = await fetch(`/api/v1/public/home/exam-spotlight?exam=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('Failed to load exam');
  return (await res.json()).data;
}

export function ExamExplorer({
  programs,
  initialExamSlug,
  initialSpotlight,
  initialProgramId,
  initialProgramStats,
}: ExamExplorerProps) {
  const [programId, setProgramId] = useState(initialProgramId);
  const [examSlug, setExamSlug] = useState(initialExamSlug);

  const program = programs.find((p) => p.id === programId) ?? programs[0];
  const exam = program.exams.find((e) => e.slug === examSlug) ?? program.exams[0];

  // Per-card numbers for every exam in the selected program.
  const { data: programStats } = useQuery({
    queryKey: ['home-program-stats', program.id],
    queryFn: () => fetchProgramStats(program.id),
    initialData: program.id === initialProgramId ? initialProgramStats : undefined,
    staleTime: 60 * 1000,
  });

  // Daily problem for the selected exam.
  const { data: spotlight } = useQuery({
    queryKey: ['home-exam-spotlight', exam.slug],
    queryFn: () => fetchSpotlight(exam.slug),
    initialData: exam.slug === initialExamSlug ? initialSpotlight : undefined,
    staleTime: 60 * 1000,
  });

  const selectedStats = programStats?.[exam.slug];
  const totalChapters = program.exams.reduce((sum, e) => sum + (programStats?.[e.slug]?.chapters ?? 0), 0);

  const selectProgram = (id: string) => {
    const next = programs.find((p) => p.id === id);
    if (!next) return;
    setProgramId(id);
    setExamSlug(next.exams[0].slug);
  };

  return (
    <section id="exam-explorer" className="scroll-mt-20 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-label-caps uppercase tracking-wider text-primary">Curriculum architecture</p>
          <h2 className="text-headline-lg mt-2 text-foreground">Target your exam</h2>
          <p className="text-body-md mt-2 text-muted-foreground">
            Pick a program, then an exam — syllabus, practice and mocks update to match.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Programs */}
          <div role="tablist" aria-label="Programs" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {programs.map((p) => {
              const active = p.id === program.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectProgram(p.id)}
                  className={cn(
                    'min-w-[200px] shrink-0 rounded-xl border p-4 text-left transition-colors lg:min-w-0',
                    active ? 'border-primary/40 bg-primary/10' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body-md font-semibold text-foreground">{p.name}</span>
                    <span className="text-label-caps shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {p.exams.length} {p.exams.length === 1 ? 'exam' : 'exams'}
                    </span>
                  </div>
                  {p.description && <p className="text-body-sm mt-1 line-clamp-2 text-muted-foreground">{p.description}</p>}
                </button>
              );
            })}
          </div>

          {/* Selected program */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-label-caps uppercase tracking-wider text-primary">Program selected</p>
                <h3 className="text-headline-md text-foreground">{program.name}</h3>
              </div>
              <p className="text-body-sm flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                {program.exams.length} {program.exams.length === 1 ? 'exam' : 'exams'}
                {programStats ? ` · ${totalChapters.toLocaleString('en-IN')} chapters` : ''}
              </p>
            </div>

            <div role="tablist" aria-label="Exams" className="-mx-1 mt-5 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
              {program.exams.map((e, i) => {
                const active = e.slug === exam.slug;
                const st = programStats?.[e.slug];
                const rows = [
                  { icon: BookOpen, value: st?.chapters, label: 'Chapters' },
                  { icon: ListChecks, value: st?.mcqs, label: 'Practice MCQs' },
                  { icon: History, value: st?.pyqs, label: 'PYQs' },
                  { icon: FileCheck2, value: st?.openMocks, label: 'Mock tests' },
                ];
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setExamSlug(e.slug)}
                    className={cn(
                      'flex w-[260px] shrink-0 snap-start flex-col rounded-xl border p-4 text-left transition-colors',
                      active ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-border bg-muted/30 hover:border-primary/40'
                    )}
                  >
                    <span className="text-label-caps uppercase tracking-wider text-primary">Exam {i + 1}</span>
                    <span className="text-body-md mt-1 font-semibold text-foreground">{e.name}</span>
                    <span className="text-body-sm mt-1 line-clamp-3 min-h-[40px] text-muted-foreground">
                      {e.description?.trim() || 'Syllabus-mapped theory, practice and mocks.'}
                    </span>
                    <ul className="mt-3 space-y-1 border-t border-border pt-1.5">
                      {rows.map(({ icon: Icon, value, label }) => (
                        <li key={label} className="text-body-sm flex items-center gap-2 text-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {value === undefined ? (
                            <Skeleton className="h-3.5 w-24" />
                          ) : (
                            <span>
                              <span className="font-semibold tabular-nums">{value.toLocaleString('en-IN')}</span> {label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Coverage bar for the selected exam — real share of chapters that already have practice MCQs. */}
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              {selectedStats ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-body-sm flex items-center gap-1.5 font-semibold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                      {exam.name} chapters with practice MCQs
                    </p>
                    <p className="text-label-caps text-muted-foreground">
                      {selectedStats.chaptersWithMcqs.toLocaleString('en-IN')} of {selectedStats.chapters.toLocaleString('en-IN')} chapters
                    </p>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-border"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={selectedStats.chapters}
                    aria-valuenow={selectedStats.chaptersWithMcqs}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${selectedStats.chapters ? (selectedStats.chaptersWithMcqs / selectedStats.chapters) * 100 : 0}%` }}
                    />
                  </div>
                </>
              ) : (
                <Skeleton className="h-10" />
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-muted-foreground">
                {selectedStats
                  ? `Includes ${selectedStats.articles.toLocaleString('en-IN')} concept ${selectedStats.articles === 1 ? 'article' : 'articles'} and ${selectedStats.openMocks.toLocaleString('en-IN')} mock ${selectedStats.openMocks === 1 ? 'test' : 'tests'} for ${exam.name}.`
                  : ''}
              </p>
              <Button className="rounded-full" asChild>
                <Link href={`/exams/${exam.slug}`}>
                  Explore full syllabus &amp; pattern <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <DailyPractice examName={exam.name} examSlug={exam.slug} problem={spotlight?.dailyProblem ?? null} loading={!spotlight} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
