import Link from 'next/link';
import { ArrowRight, BarChart3, ClipboardCheck, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { PATTERN } from '@/content/exams/nimcet/official';
import type { NimcetMock } from '@/server/services/exam-landing/nimcet';
import { MockList, MockProvenanceNote } from './mock-list';

export function MockSection({ mocks, signedIn, buildMockHref }: { mocks: NimcetMock[]; signedIn: boolean; buildMockHref: string }) {
  const features = [
    { icon: <Timer className="h-4 w-4" />, text: `Timed tests. The real paper is ${PATTERN.totalQuestions} questions in ${PATTERN.durationMinutes} minutes, split into three fixed parts.` },
    { icon: <BarChart3 className="h-4 w-4" />, text: 'A scored result after you submit, with every answer reviewed, plus your score trend on the progress page.' },
  ];

  return (
    <LandingSection id="mocks">
      <SectionHeader
        eyebrow="Mock tests"
        icon={<ClipboardCheck className="h-3.5 w-3.5" />}
        title="Test yourself under exam conditions"
        description="Mocks show where marks slip away: speed, accuracy, or units you haven’t revised."
        action={
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={`${NIMCET_PATH}/mock-tests`}>
              All mock tests <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f.text} className="text-body-sm flex gap-3 rounded-xl border border-border bg-card p-4 text-muted-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">{f.icon}</span>
            {f.text}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <MockList mocks={mocks} signedIn={signedIn} buildMockHref={buildMockHref} limit={3} />
      </div>
      <div className="mt-4">
        <MockProvenanceNote />
      </div>
    </LandingSection>
  );
}
