import Link from 'next/link';
import { BookOpen, FileText, ListChecks, Network, Target } from 'lucide-react';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';
import { SubjectIcon } from './subject-icon';

// One card per subject with direct links to that subject's syllabus, paper pattern,
// practice and notes. Links that would lead to an empty page (no questions / no notes yet)
// are left out rather than shown dead.
export function SubjectResources({ board, subjects, examPracticeHref }: { board: CbseBoard; subjects: LandingSubject[]; examPracticeHref: string }) {
  if (subjects.length === 0) return null;
  const slug = board.examSlug;

  return (
    <LandingSection id="subjects">
      <SectionHeader
        eyebrow="Subjects"
        icon={<BookOpen className="h-3.5 w-3.5" />}
        title={`Study ${board.shortLabel} subject by subject`}
        description="Jump straight to a subject's chapters, its paper pattern, practice questions and notes."
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.map((s) => {
          const hasPattern = !!(s.key && board.patterns[s.key]);
          const links = [
            { href: `${cbsePath(slug, 'syllabus')}#syllabus-${s.slug}`, label: `${s.name} syllabus`, icon: <ListChecks className="h-3.5 w-3.5" /> },
            hasPattern && { href: `${cbsePath(slug, 'paper-pattern')}#pattern-${s.slug}`, label: `${s.name} paper pattern`, icon: <FileText className="h-3.5 w-3.5" /> },
            { href: s.questionCount > 0 ? s.practiceHref : examPracticeHref, label: `${s.name} MCQs`, icon: <Target className="h-3.5 w-3.5" /> },
            s.articleCount > 0 && { href: s.notesHref, label: `${s.name} notes`, icon: <BookOpen className="h-3.5 w-3.5" /> },
            s.mindMapCount > 0 && { href: s.mindMapsHref, label: `${s.name} mind maps`, icon: <Network className="h-3.5 w-3.5" /> },
          ].filter((l): l is { href: string; label: string; icon: React.ReactElement } => !!l);

          return (
            <li key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <SubjectIcon subjectKey={s.key} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {s.chapters.length} chapters{s.questionCount > 0 ? ` · ${s.questionCount.toLocaleString('en-IN')} MCQs` : ''}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary">
                      {l.icon}
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
}
