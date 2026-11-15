import Link from 'next/link';
import { ArrowRight, BookOpen, ListChecks, Network, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';
import { SubjectIcon } from './subject-icon';

function count(n: number, noun: string) {
  return `${n.toLocaleString('en-IN')} ${noun}${n === 1 ? '' : 's'}`;
}

/** Jump links to each subject's section on the syllabus page. */
export function SubjectJumpLinks({ subjects, prefix = 'syllabus' }: { subjects: LandingSubject[]; prefix?: string }) {
  return (
    <nav aria-label="Subjects">
      <ul className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <li key={s.id}>
            <a
              href={`#${prefix}-${s.slug}`}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <SubjectIcon subjectKey={s.key} />
              {s.name}
              <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">{s.chapters.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Every subject as its own section with its full chapter list — all server-rendered, so
// the whole syllabus is in the page's HTML. "Practise" deep-links the practice browser to a
// chapter; "Notes" only appears once that chapter has published notes, so neither leads to
// an empty page.
export function SyllabusList({ subjects, classLabel, examPracticeHref }: { subjects: LandingSubject[]; classLabel: string; examPracticeHref: string }) {
  return (
    <div className="space-y-6">
      {subjects.map((subject) => (
        <section
          key={subject.id}
          id={`syllabus-${subject.slug}`}
          aria-labelledby={`syllabus-${subject.slug}-heading`}
          className="scroll-mt-32 overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/30 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SubjectIcon subjectKey={subject.key} className="h-5 w-5" />
              </span>
              <div>
                <h2 id={`syllabus-${subject.slug}-heading`} className="text-headline-md text-foreground">
                  {classLabel} {subject.name} syllabus
                </h2>
                <p className="text-body-sm mt-0.5 text-muted-foreground">
                  {count(subject.chapters.length, 'chapter')} ·{' '}
                  {subject.questionCount > 0 ? count(subject.questionCount, 'practice question') : 'chapter-wise questions coming soon'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {subject.articleCount > 0 && (
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link href={subject.notesHref}>
                    <BookOpen className="h-4 w-4" /> {subject.name} notes
                  </Link>
                </Button>
              )}
              {/* Questions not yet tagged to this subject would make a subject filter come back
                  empty, so fall back to the exam-wide set rather than a dead end. */}
              <Button size="sm" className="rounded-full" asChild>
                <Link href={subject.questionCount > 0 ? subject.practiceHref : examPracticeHref}>
                  {subject.questionCount > 0 ? `Practise ${subject.name} MCQs` : `Practise mixed ${classLabel} questions`} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {subject.chapters.length === 0 ? (
            <p className="text-body-sm p-6 text-muted-foreground">Chapters for {subject.name} are being added.</p>
          ) : (
            <ol className="divide-y divide-border">
              {subject.chapters.map((chapter, i) => (
                <li key={chapter.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-mono text-sm font-semibold text-secondary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{chapter.name}</h3>
                    {chapter.topicNames.length > 0 ? (
                      <p className="text-body-sm mt-0.5 text-muted-foreground">{chapter.topicNames.join(', ')}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">{chapter.questionCount > 0 ? count(chapter.questionCount, 'question') : 'Questions coming soon'}</p>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:justify-end">
                    {chapter.mindMapHref && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={chapter.mindMapHref} aria-label={`${chapter.name} mind map`}>
                          <Network className="h-4 w-4" /> Mind map
                        </Link>
                      </Button>
                    )}
                    {chapter.articleCount > 0 && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={chapter.notesHref} aria-label={`${chapter.name} notes`}>
                          <PenLine className="h-4 w-4" /> Notes
                        </Link>
                      </Button>
                    )}
                    {chapter.questionCount > 0 ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={chapter.practiceHref} aria-label={`Practise ${chapter.name} questions`}>
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
        </section>
      ))}
    </div>
  );
}
