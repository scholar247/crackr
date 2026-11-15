import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';
import { SubjectIcon } from './subject-icon';

// Every subject, chapter and topic with questions, as plain server-rendered links with
// descriptive anchors ("Real Numbers MCQs") — the crawlable counterpart of the dropdown
// finder, so each chapter and topic can be found from search. Anything without questions
// yet is shown as text (or left out, for topics) rather than as a link to an empty set.
export function PracticeDirectory({ subjects, classLabel }: { subjects: LandingSubject[]; classLabel: string }) {
  const withChapters = subjects.filter((s) => s.chapters.length > 0);
  if (withChapters.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {withChapters.map((s) => (
        <section key={s.id} aria-labelledby={`mcq-${s.slug}`} className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h3 id={`mcq-${s.slug}`} className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <SubjectIcon subjectKey={s.key} />
              </span>
              <span className="truncate">
                {classLabel} {s.name} MCQs
              </span>
            </h3>
            {s.questionCount > 0 && (
              <Link href={s.practiceHref} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
                All {s.questionCount} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>

          <ol className="divide-y divide-border">
            {s.chapters.map((c, i) => {
              const topics = c.topics.filter((t) => t.questionCount > 0);
              return (
                <li key={c.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-xs font-semibold text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        {c.questionCount > 0 ? (
                          <Link href={c.practiceHref} className="font-medium text-foreground hover:text-primary hover:underline">
                            {c.name} MCQs
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground">{c.name}</span>
                        )}
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{c.questionCount > 0 ? `${c.questionCount} Qs` : 'Soon'}</span>
                      </div>
                      {topics.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`${c.name} topics`}>
                          {topics.map((t) => (
                            <li key={t.id}>
                              <Link
                                href={t.practiceHref}
                                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                {t.name}
                                <span className="font-mono tabular-nums opacity-70">{t.questionCount}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
