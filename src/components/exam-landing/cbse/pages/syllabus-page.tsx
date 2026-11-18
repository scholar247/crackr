import Link from 'next/link';
import { ArrowRight, Network } from 'lucide-react';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { JsonLd } from '@/components/exam-landing/shared/json-ld';
import { collectionPageJsonLd } from '../seo';
import { CbsePageShell } from '../page-shell';
import { SubjectJumpLinks, SyllabusList } from '../syllabus-list';
import { cbsePath } from '../paths';

export function CbseSyllabusPage({ data }: { data: CbseLandingData }) {
  const { board, subjects, stats, links } = data;
  const c = board.shortLabel;
  // Chapters with a published mind map — the syllabus is their main entry point.
  const mapped = subjects.flatMap((s) => s.chapters.filter((ch) => ch.mindMapHref).map((ch) => ({ subject: s, chapter: ch })));

  return (
    <CbsePageShell
      board={board}
      current="syllabus"
      eyebrow={`CBSE · ${c} · Session ${board.session}`}
      title={`${board.label} Syllabus ${board.session}`}
      intro={
        <>
          The {c} syllabus for {board.coreSubjects}, subject by subject: {stats.chapters} chapters across {stats.subjects} subjects, with the topics in each
          chapter. Practise any chapter straight from its row, and see how each subject is examined on the{' '}
          <Link href={cbsePath(board.examSlug, 'paper-pattern')} className="font-medium text-primary hover:underline">
            {c} paper pattern
          </Link>{' '}
          page.
        </>
      }
    >
      <PageSection id="subjects" title={`${c} subjects`} description="Jump to a subject to see its chapters and topics.">
        <SubjectJumpLinks subjects={subjects} />
      </PageSection>

      {mapped.length > 0 && (
        <aside aria-label="Mind maps" className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Network className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-foreground">Revise the syllabus visually</p>
              <p className="text-body-sm mt-0.5 text-muted-foreground">
                {mapped.length} chapter{mapped.length === 1 ? ' has' : 's have'} an interactive mind map. Tap <strong className="font-medium text-foreground">View mind map</strong> on a chapter, or any
                topic to open the map right at that topic.
              </p>
            </div>
          </div>
          <Link href={cbsePath(board.examSlug, 'mind-maps')} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            All {c} mind maps <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </aside>
      )}

      <SyllabusList subjects={subjects} classLabel={c} examPracticeHref={links.practice} />

      <p className="text-body-sm text-muted-foreground">
        Chapters follow the NCERT textbooks prescribed by CBSE. Always check the official CBSE curriculum for your session for deleted or added topics.
      </p>

      {mapped.length > 0 && (
        <JsonLd
          data={collectionPageJsonLd({
            path: cbsePath(board.examSlug, 'syllabus'),
            name: `${board.label} Syllabus ${board.session}`,
            description: `Chapter-wise ${board.label} syllabus with interactive mind maps.`,
            items: mapped.map(({ subject, chapter }) => ({ name: `${c} ${subject.name}: ${chapter.name} mind map`, path: chapter.mindMapHref! })),
          })}
        />
      )}
    </CbsePageShell>
  );
}
