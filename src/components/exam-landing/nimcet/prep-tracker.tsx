import Link from 'next/link';
import { ArrowRight, Gauge, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { ProgressStatCard } from '@/components/progress/progress-stat-card';
import { progressColorFor } from '@/components/progress/progress-chart-colors';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import type { NimcetSubject } from '@/server/services/exam-landing/nimcet';
import { gated } from './utils';

// Example values for the signed-out preview only. They're rendered inside a block labelled
// "Sample", never next to the viewer's name or as their data.
const SAMPLE = {
  latest: 62,
  best: 68,
  attempts: 5,
  subjects: [
    { name: 'Maths', value: 58 },
    { name: 'Reasoning', value: 71 },
    { name: 'Computers', value: 66 },
    { name: 'English', value: 75 },
  ],
};

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{v}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-secondary" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function PrepTracker({
  signedIn,
  progress,
  subjects,
  buildMockHref,
}: {
  signedIn: boolean;
  progress: ProgressGroup | null;
  subjects: NimcetSubject[];
  buildMockHref: string;
}) {
  const header = (
    <SectionHeader
      eyebrow="Preparation tracker"
      icon={<Gauge className="h-3.5 w-3.5" />}
      title="See where you stand"
      description="Your mock scores, overall and per subject, with the subject to work on next."
    />
  );

  if (signedIn && progress) {
    const measured = subjects.filter((s) => s.progress);
    const weakest = [...measured].sort((a, b) => a.progress!.avgPercentage - b.progress!.avgPercentage)[0];
    return (
      <LandingSection id="tracker">
        {header}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <ProgressStatCard group={progress} accent={progressColorFor(0)} href="/progress" />
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground">Subject-wise mock average</h3>
            {measured.length > 0 ? (
              <div className="mt-4 space-y-4">
                {measured.map((s) => (
                  <Bar key={s.slug} label={s.name} value={s.progress!.avgPercentage} />
                ))}
              </div>
            ) : (
              <p className="text-body-sm mt-2 text-muted-foreground">Subject scores appear once you take a mock with subject-specific sections.</p>
            )}
            <div className="mt-auto pt-5">
              <p className="text-label-caps uppercase text-muted-foreground">Next recommended step</p>
              {weakest ? (
                <Link href={weakest.href} className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                  Revise {weakest.name}, your lowest-scoring subject <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href={buildMockHref} className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                  Take a mock with one section per subject <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </LandingSection>
    );
  }

  if (signedIn) {
    return (
      <LandingSection id="tracker">
        {header}
        <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-6">
          <LineChart className="h-6 w-6 text-secondary" aria-hidden />
          <p className="font-semibold text-foreground">Your tracker starts with your first NIMCET mock</p>
          <p className="text-body-sm text-muted-foreground">Take a mock and your score, best result, trend and subject-wise averages appear here.</p>
          <Button size="sm" className="rounded-full" asChild>
            <Link href={buildMockHref}>Build your first mock</Link>
          </Button>
        </div>
      </LandingSection>
    );
  }

  return (
    <LandingSection id="tracker">
      {header}
      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
        <figure className="relative rounded-2xl border border-border bg-card p-6" aria-label="Sample tracker with example numbers">
          <span className="text-label-caps absolute right-4 top-4 rounded-full bg-warning/15 px-2.5 py-1 uppercase text-warning">Sample</span>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Latest mock', value: `${SAMPLE.latest}%` },
              { label: 'Best', value: `${SAMPLE.best}%` },
              { label: 'Mocks taken', value: SAMPLE.attempts },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-headline-md text-foreground">{m.value}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {SAMPLE.subjects.map((s) => (
              <Bar key={s.name} label={s.name} value={s.value} />
            ))}
          </div>
          <figcaption className="mt-4 text-xs text-muted-foreground">Example numbers only, to show what the tracker looks like. This is not anyone’s real data.</figcaption>
        </figure>
        <div className="flex flex-col items-start gap-3">
          <p className="text-body-lg font-semibold text-foreground">Track your own scores</p>
          <p className="text-body-sm text-muted-foreground">
            Sign in to take mocks. Every submitted mock is saved, and your overall and subject-wise trend builds up here and on your progress page.
          </p>
          <Button className="rounded-full" asChild>
            <Link href={gated(NIMCET_PATH, false)}>Sign in to start tracking</Link>
          </Button>
        </div>
      </div>
    </LandingSection>
  );
}
