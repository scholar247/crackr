'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, FlaskConical, Landmark, Languages, ListChecks, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LandingSubject } from '@/server/services/exam-landing/cbse-class-10';
import type { SubjectKey } from './content';

const SUBJECT_ICON: Record<SubjectKey, React.ReactNode> = {
  maths: <Calculator className="h-4 w-4" />,
  science: <FlaskConical className="h-4 w-4" />,
  'social-science': <Landmark className="h-4 w-4" />,
  english: <Languages className="h-4 w-4" />,
};

function count(n: number, noun: string) {
  return `${n.toLocaleString('en-IN')} ${noun}${n === 1 ? '' : 's'}`;
}

// Subject tabs → that subject's chapters, each with its own "Practise" and "Notes" actions.
// Practise deep-links the practice browser to the chapter; Notes only shows once the chapter
// has published articles, so it never leads to an empty page.
export function SyllabusExplorer({ subjects, examPracticeHref }: { subjects: LandingSubject[]; examPracticeHref: string }) {
  const [activeId, setActiveId] = useState(subjects[0]?.id);
  const active = subjects.find((s) => s.id === activeId) ?? subjects[0];
  if (!active) return null;

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Subjects" className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {subjects.map((s) => {
          const selected = s.id === active.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`subject-tab-${s.id}`}
              aria-selected={selected}
              aria-controls={`subject-panel-${s.id}`}
              onClick={() => setActiveId(s.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40',
              )}
            >
              {s.key ? SUBJECT_ICON[s.key] : <BookOpen className="h-4 w-4" />}
              {s.name}
              <span className={cn('rounded-full px-1.5 text-[11px]', selected ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground')}>
                {s.chapters.length}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`subject-panel-${active.id}`}
        aria-labelledby={`subject-tab-${active.id}`}
        className="mt-5 overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/30 p-5">
          <div>
            <h3 className="text-headline-md text-foreground">{active.name}</h3>
            <p className="text-body-sm mt-0.5 text-muted-foreground">
              {count(active.chapters.length, 'chapter')} ·{' '}
              {active.questionCount > 0 ? count(active.questionCount, 'practice question') : 'chapter-wise questions coming soon'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active.articleCount > 0 && (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href={active.notesHref}>
                  <BookOpen className="h-4 w-4" /> {active.name} notes
                </Link>
              </Button>
            )}
            {/* Questions not yet tagged to this subject would make a subject filter come back empty,
                so fall back to the exam-wide set rather than a dead end. */}
            <Button size="sm" className="rounded-full" asChild>
              <Link href={active.questionCount > 0 ? active.practiceHref : examPracticeHref}>
                {active.questionCount > 0 ? `Practise all ${active.name}` : 'Practise mixed Class 10 questions'} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {active.chapters.length === 0 ? (
          <p className="text-body-sm p-6 text-muted-foreground">Chapters for {active.name} are being added.</p>
        ) : (
          <ol className="divide-y divide-border">
            {active.chapters.map((chapter, i) => (
              <li key={chapter.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-mono text-sm font-semibold text-secondary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{chapter.name}</p>
                  <p className="text-body-sm mt-0.5 text-muted-foreground">
                    {chapter.questionCount > 0 ? count(chapter.questionCount, 'question') : 'Questions coming soon'}
                    {chapter.topicNames.length > 0 && <> · {chapter.topicNames.slice(0, 3).join(', ')}</>}
                    {chapter.topicNames.length > 3 && ` +${chapter.topicNames.length - 3} more`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:justify-end">
                  {chapter.articleCount > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={chapter.notesHref}>
                        <PenLine className="h-4 w-4" /> Notes
                      </Link>
                    </Button>
                  )}
                  {chapter.questionCount > 0 ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={chapter.practiceHref}>
                        <ListChecks className="h-4 w-4" /> Practise
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ListChecks className="h-4 w-4" /> Soon
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
