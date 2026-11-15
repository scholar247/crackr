import { CheckCircle2, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { CbseBoard, RoadmapPhase } from '@/content/exams/cbse/types';

// The board year as phases, with the student's current phase (by today's month) marked.
export function PrepRoadmap({ board, current, muted = true }: { board: CbseBoard; current: RoadmapPhase; muted?: boolean }) {
  const roadmap = board.roadmap;
  const currentIndex = roadmap.findIndex((p) => p.id === current.id);

  return (
    <LandingSection id="roadmap" muted={muted}>
      <SectionHeader
        eyebrow="Study plan"
        icon={<MapIcon className="h-3.5 w-3.5" />}
        title={`Your ${board.shortLabel} study plan`}
        description="What to focus on in each part of the year, from the first chapter to the board exam."
      />

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {roadmap.map((phase, i) => {
          const isCurrent = phase.id === current.id;
          const isDone = i < currentIndex;
          return (
            <li
              key={phase.id}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-5',
                isCurrent ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border',
                isDone && 'opacity-70',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold',
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                {isCurrent && <span className="text-label-caps rounded-full bg-primary/10 px-2 py-0.5 uppercase text-primary">You are here</span>}
              </div>
              <p className="text-label-caps mt-4 uppercase text-muted-foreground">{phase.window}</p>
              <h3 className="mt-1 font-semibold text-foreground">{phase.title}</h3>
              <ul className="text-body-sm mt-3 space-y-1.5 text-muted-foreground">
                {phase.focus.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
                    {f}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </LandingSection>
  );
}
