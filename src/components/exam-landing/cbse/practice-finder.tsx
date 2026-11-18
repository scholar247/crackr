'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Flame, RotateCcw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';
import { SubjectIcon } from './subject-icon';

const ALL = 'all';

function plural(n: number, noun: string) {
  return `${n.toLocaleString('en-IN')} ${noun}${n === 1 ? '' : 's'}`;
}

/** Option row: name on the left, question count (or "Soon") on the right. */
function OptionLabel({ name, count }: { name: string; count: number }) {
  return (
    <span className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="truncate">{name}</span>
      <span
        className={cn(
          'shrink-0 rounded-full px-1.5 py-px font-mono text-[11px] tabular-nums',
          count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {count > 0 ? count : 'Soon'}
      </span>
    </span>
  );
}

function StepField({ step, label, htmlFor, children }: { step: number; label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary">{step}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

// Subject → Chapter → Topic picker for the practice page. Each level narrows the next and
// shows how many questions it has. Empty ones stay selectable (students can still explore
// the syllabus) and are marked "Soon"; the summary below always says exactly what
// "Practise" will open, falling back to mixed practice when nothing is tagged there yet. The choice is mirrored into readable query
// params (?subject=…&chapter=…&topic=… by slug) so a selection can be shared or bookmarked.
export function PracticeFinder({
  subjects,
  classLabel,
  totalQuestions,
  examPracticeHref,
}: {
  subjects: LandingSubject[];
  classLabel: string;
  totalQuestions: number;
  examPracticeHref: string;
}) {
  const params = useSearchParams();
  const [subjectSlug, setSubjectSlug] = useState(() => (subjects.some((s) => s.slug === params.get('subject')) ? params.get('subject')! : ALL));
  const subject = subjects.find((s) => s.slug === subjectSlug) ?? null;
  const [chapterSlug, setChapterSlug] = useState(() => (subject?.chapters.some((c) => c.slug === params.get('chapter')) ? params.get('chapter')! : ALL));
  const chapter = subject?.chapters.find((c) => c.slug === chapterSlug) ?? null;
  const [topicSlug, setTopicSlug] = useState(() => (chapter?.topics.some((t) => t.slug === params.get('topic')) ? params.get('topic')! : ALL));
  const topic = chapter?.topics.find((t) => t.slug === topicSlug) ?? null;

  const select = (next: { subject: string; chapter: string; topic: string }) => {
    setSubjectSlug(next.subject);
    setChapterSlug(next.chapter);
    setTopicSlug(next.topic);
    const qs = new URLSearchParams();
    if (next.subject !== ALL) qs.set('subject', next.subject);
    if (next.chapter !== ALL) qs.set('chapter', next.chapter);
    if (next.topic !== ALL) qs.set('topic', next.topic);
    const query = qs.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  };

  const count = topic?.questionCount ?? chapter?.questionCount ?? subject?.questionCount ?? totalQuestions;
  const href = topic?.practiceHref ?? chapter?.practiceHref ?? subject?.practiceHref ?? examPracticeHref;
  const notes = chapter && chapter.articleCount > 0 ? { href: chapter.notesHref, label: `${chapter.name} notes` } : subject && !chapter && subject.articleCount > 0 ? { href: subject.notesHref, label: `${subject.name} notes` } : null;
  const trail = [subject?.name, chapter?.name, topic?.name].filter(Boolean) as string[];

  // One-tap shortcuts to the chapters with the most questions.
  const popular = subjects
    .flatMap((s) => s.chapters.filter((c) => c.questionCount > 0).map((c) => ({ subject: s, chapter: c })))
    .sort((a, b) => b.chapter.questionCount - a.chapter.questionCount)
    .slice(0, 6);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-3">
        <StepField step={1} label="Subject" htmlFor="pf-subject">
          <Select value={subjectSlug} onValueChange={(v) => select({ subject: v, chapter: ALL, topic: ALL })}>
            <SelectTrigger id="pf-subject" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                <OptionLabel name={`All subjects (mixed)`} count={totalQuestions} />
              </SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.slug}>
                  <span className="flex w-full items-center gap-2">
                    <SubjectIcon subjectKey={s.key} className="shrink-0 text-muted-foreground" />
                    <OptionLabel name={s.name} count={s.questionCount} />
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StepField>

        <StepField step={2} label="Chapter" htmlFor="pf-chapter">
          {/* An empty value shows the placeholder hint until there's a subject to pick chapters from. */}
          <Select value={subject ? chapterSlug : ''} onValueChange={(v) => select({ subject: subjectSlug, chapter: v, topic: ALL })} disabled={!subject}>
            <SelectTrigger id="pf-chapter" className="w-full">
              <SelectValue placeholder="Choose a subject first" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {subject && (
                <SelectItem value={ALL}>
                  <OptionLabel name="All chapters" count={subject.questionCount} />
                </SelectItem>
              )}
              {subject?.chapters.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  <OptionLabel name={c.name} count={c.questionCount} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StepField>

        <StepField step={3} label="Topic" htmlFor="pf-topic">
          <Select
            value={chapter && chapter.topics.length > 0 ? topicSlug : ''}
            onValueChange={(v) => select({ subject: subjectSlug, chapter: chapterSlug, topic: v })}
            disabled={!chapter || chapter.topics.length === 0}
          >
            <SelectTrigger id="pf-topic" className="w-full">
              <SelectValue placeholder={chapter ? 'No topics in this chapter' : 'Choose a chapter first'} />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {chapter && chapter.topics.length > 0 && (
                <SelectItem value={ALL}>
                  <OptionLabel name="All topics" count={chapter.questionCount} />
                </SelectItem>
              )}
              {chapter?.topics.map((t) => (
                <SelectItem key={t.id} value={t.slug}>
                  <OptionLabel name={t.name} count={t.questionCount} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StepField>
      </div>

      {/* What "Practise" will open — always in sync with the dropdowns. */}
      <div className="flex flex-col gap-4 border-t border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-3" aria-live="polite">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-headline-md leading-tight text-foreground">{count > 0 ? plural(count, 'question') : 'Questions coming soon'}</p>
            <p className="text-body-sm truncate text-muted-foreground">
              {trail.length ? trail.join(' › ') : `All ${classLabel} subjects, mixed`}
              {count > 0 ? ' · with worked solutions' : ` · meanwhile, try mixed ${classLabel} practice`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {trail.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => select({ subject: ALL, chapter: ALL, topic: ALL })}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          )}
          {notes && (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href={notes.href}>
                <BookOpen className="h-4 w-4" /> {notes.label}
              </Link>
            </Button>
          )}
          {count > 0 ? (
            <Button className="rounded-full" asChild>
              <Link href={href}>
                Practise {plural(count, 'MCQ')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="rounded-full" asChild>
              <Link href={examPracticeHref}>
                Practise mixed {classLabel} MCQs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {popular.length > 0 && (
        <div className="border-t border-border px-5 py-4 sm:px-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-warning" aria-hidden /> Popular chapters
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {popular.map(({ subject: s, chapter: c }) => {
              const active = chapter?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => select({ subject: s.slug, chapter: c.slug, topic: ALL })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  <SubjectIcon subjectKey={s.key} className={cn('h-3.5 w-3.5', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
                  {c.name}
                  <span className={cn('font-mono tabular-nums', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{c.questionCount}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
