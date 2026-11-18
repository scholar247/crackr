import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, ListChecks, Network, Target } from 'lucide-react';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { LandingSubject } from '@/server/services/exam-landing/cbse';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';
import { SubjectIcon, subjectTone } from './subject-icon';

// One colourful card per subject: a few chapter chips that open the chapter's mind map
// (or its practice when there's no map yet), then direct links to the subject's syllabus,
// paper pattern, MCQs, notes and mind maps. Links that would lead to an empty page are
// left out. On phones the cards are a swipeable row; on larger screens, a grid.
export function SubjectResources({ board, subjects, examPracticeHref }: { board: CbseBoard; subjects: LandingSubject[]; examPracticeHref: string }) {
  if (subjects.length === 0) return null;
  const slug = board.examSlug;

  return (
    <LandingSection id="subjects">
      <SectionHeader
        eyebrow="Subjects"
        icon={<BookOpen className="h-3.5 w-3.5" />}
        title={`Study ${board.shortLabel} subject by subject`}
        description="Open a chapter's mind map in one tap, or jump to the subject's syllabus, paper pattern, practice and notes."
      />
      <ul className="-mx-4 mt-7 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {subjects.map((s) => {
          const tone = subjectTone(s.key);
          const hasPattern = !!(s.key && board.patterns[s.key]);
          const chapters = [...s.chapters].sort((a, b) => Number(!!b.mindMapHref) - Number(!!a.mindMapHref)).slice(0, 4);
          const links = [
            { href: `${cbsePath(slug, 'syllabus')}#syllabus-${s.slug}`, label: 'Syllabus', icon: <ListChecks className="h-3.5 w-3.5" /> },
            hasPattern && { href: `${cbsePath(slug, 'paper-pattern')}#pattern-${s.slug}`, label: 'Paper pattern', icon: <FileText className="h-3.5 w-3.5" /> },
            { href: s.questionCount > 0 ? s.practiceHref : examPracticeHref, label: s.questionCount > 0 ? `${s.questionCount.toLocaleString('en-IN')} MCQs` : 'MCQs', icon: <Target className="h-3.5 w-3.5" /> },
            s.articleCount > 0 && { href: s.notesHref, label: 'Notes', icon: <BookOpen className="h-3.5 w-3.5" /> },
            s.mindMapCount > 0 && { href: s.mindMapsHref, label: `${s.mindMapCount} mind map${s.mindMapCount === 1 ? '' : 's'}`, icon: <Network className="h-3.5 w-3.5" /> },
          ].filter((l): l is { href: string; label: string; icon: React.ReactElement } => !!l);

          return (
            <li key={s.id} className="w-[84%] shrink-0 snap-start sm:w-auto">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-lg">
                <div className={`relative flex items-center gap-3 bg-gradient-to-br ${tone.gradient} p-4 text-white`}>
                  <span aria-hidden className="pointer-events-none absolute -right-6 -bottom-8 opacity-20">
                    <SubjectIcon subjectKey={s.key} className="h-24 w-24" />
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                    <SubjectIcon subjectKey={s.key} className="h-5 w-5" />
                  </span>
                  <div className="relative">
                    <h3 className="text-lg leading-tight font-bold">{s.name}</h3>
                    <p className="text-xs text-white/85">
                      {s.chapters.length} chapters{s.mindMapCount > 0 ? ` · ${s.mindMapCount} mind maps` : ''}
                    </p>
                  </div>
                </div>

                {chapters.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 px-4 pt-4" aria-label={`${s.name} chapters`}>
                    {chapters.map((ch) => (
                      <li key={ch.id}>
                        <Link
                          href={ch.mindMapHref ? `${ch.mindMapHref}#mind-map` : ch.practiceHref}
                          title={ch.mindMapHref ? `${ch.name} mind map` : `${ch.name} practice`}
                          className={`inline-flex max-w-[15rem] items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition hover:brightness-110 ${tone.soft}`}
                        >
                          {ch.mindMapHref && <Network className="h-3 w-3 shrink-0" aria-hidden />}
                          <span className="truncate">{ch.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <ul className="mt-auto grid grid-cols-2 gap-1 p-3 pt-4">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary">
                        {l.icon}
                        <span className="truncate">{l.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`${cbsePath(slug, 'syllabus')}#syllabus-${s.slug}`} className="flex items-center justify-between border-t border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5">
                  All {s.name} chapters <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-center text-xs text-muted-foreground sm:hidden" aria-hidden>
        Swipe to see all subjects →
      </p>
    </LandingSection>
  );
}
