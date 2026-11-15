import Link from 'next/link';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { CbsePageShell } from '../page-shell';
import { SubjectJumpLinks, SyllabusList } from '../syllabus-list';
import { cbsePath } from '../paths';

export function CbseSyllabusPage({ data }: { data: CbseLandingData }) {
  const { board, subjects, stats, links } = data;
  const c = board.shortLabel;

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

      <SyllabusList subjects={subjects} classLabel={c} examPracticeHref={links.practice} />

      <p className="text-body-sm text-muted-foreground">
        Chapters follow the NCERT textbooks prescribed by CBSE. Always check the official CBSE curriculum for your session for deleted or added topics.
      </p>
    </CbsePageShell>
  );
}
