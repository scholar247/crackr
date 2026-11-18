import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { CbsePageShell } from '../page-shell';
import { PatternHighlights, SubjectPatterns } from '../paper-pattern';

export function CbsePaperPatternPage({ data }: { data: CbseLandingData }) {
  const { board, subjects, links } = data;
  const c = board.shortLabel;

  return (
    <CbsePageShell
      board={board}
      current="paper-pattern"
      eyebrow={`CBSE · ${c} · Session ${board.session}`}
      title={`${board.label} Paper Pattern & Marking Scheme`}
      intro={<>{board.patternIntro} Below is how each paper is split into sections, the question types in each, and the marks they carry.</>}
    >
      <PageSection id="rules" title={`${c} board exam: marks and passing rules`}>
        <PatternHighlights board={board} />
      </PageSection>

      <PageSection id="subjects" title="Subject-wise paper pattern" description="Section-by-section breakdown of each theory paper, in syllabus order.">
        <SubjectPatterns board={board} subjects={subjects} />
        <p className="mt-4 text-xs text-muted-foreground">{board.patternSource}</p>
      </PageSection>

      <PageSection
        id="next"
        title="See the pattern in a real paper"
        description="The official CBSE sample papers follow this exact structure. Solve one under a 3-hour timer, then check your answers against the marking scheme."
      >
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full" asChild>
            <Link href={links.samplePapers}>
              {c} sample papers <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href={links.practice}>Practise {c} MCQs</Link>
          </Button>
        </div>
      </PageSection>
    </CbsePageShell>
  );
}
