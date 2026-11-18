import Link from 'next/link';
import { ArrowRight, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { CbsePageShell } from '../page-shell';
import { NotesGrid } from '../study-notes';
import { SubjectIcon } from '../subject-icon';

export function CbseNotesPage({ data }: { data: CbseLandingData }) {
  const { board, subjects, articles, links } = data;
  const c = board.shortLabel;
  const subjectsWithNotes = subjects.filter((s) => s.articleCount > 0);

  return (
    <CbsePageShell
      board={board}
      current="notes"
      eyebrow={`CBSE · ${c} · Study material`}
      title={`${board.label} Notes: Chapter-wise Revision`}
      intro={
        <>
          Chapter notes, solved examples and quick revision guides for {c}, mapped to the CBSE syllabus. Read a chapter&apos;s notes, then practise its questions to
          check you&apos;ve understood it.
        </>
      }
    >
      {subjectsWithNotes.length > 0 && (
        <PageSection id="by-subject" title="Notes by subject and chapter">
          <div className="grid gap-4 md:grid-cols-2">
            {subjectsWithNotes.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
                    <SubjectIcon subjectKey={s.key} className="text-secondary" /> {c} {s.name} notes
                  </h3>
                  <Link href={s.notesHref} className="text-sm font-medium text-primary hover:underline">
                    All {s.articleCount}
                  </Link>
                </div>
                <ul className="mt-3 space-y-1">
                  {s.chapters
                    .filter((ch) => ch.articleCount > 0)
                    .map((ch) => (
                      <li key={ch.id}>
                        <Link href={ch.notesHref} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary">
                          <PenLine className="h-3.5 w-3.5" aria-hidden /> {ch.name} notes
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </PageSection>
      )}

      <PageSection
        id="latest"
        title={`Latest ${c} notes`}
        action={
          articles.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href={links.notes}>
                Browse every {c} note <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )
        }
      >
        <NotesGrid articles={articles} classLabel={c} practiceHref={links.practice} />
      </PageSection>
    </CbsePageShell>
  );
}
