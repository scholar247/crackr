import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { periodLabel, samplePapersPath, type SamplePaperExamConfig } from '@/lib/sample-papers';

export interface Step {
  label: string;
  /** What was chosen at this step ("2025-26", "Mathematics"); omitted for upcoming steps. */
  value?: string;
  /** Link back to this step so the choice can be changed; set on completed steps. */
  href?: string;
}

/**
 * Session → Subject → Paper progress. Steps before `current` are done (and link back to
 * change the choice), `current` is highlighted, the rest are upcoming. Plain links, so it
 * works without JS and doubles as in-site navigation for crawlers.
 */
export function SamplePaperStepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <nav aria-label="Sample paper steps">
      <ol className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row sm:items-stretch sm:gap-0">
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
          const body = (
            <>
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  state === 'done' && 'bg-secondary text-secondary-foreground',
                  state === 'current' && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                  state === 'upcoming' && 'border border-border bg-background text-muted-foreground',
                )}
                aria-hidden
              >
                {state === 'done' ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn('text-label-caps block uppercase tracking-wider', state === 'upcoming' ? 'text-muted-foreground' : 'text-primary')}>
                  {step.label}
                </span>
                <span className={cn('block truncate text-sm font-medium', state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}>
                  {step.value ?? (state === 'current' ? 'Choose below' : '—')}
                </span>
              </span>
            </>
          );

          return (
            <li key={step.label} className="flex min-w-0 flex-1 items-center sm:[&:not(:last-child)]:after:mx-2 sm:[&:not(:last-child)]:after:h-px sm:[&:not(:last-child)]:after:w-8 sm:[&:not(:last-child)]:after:shrink-0 sm:[&:not(:last-child)]:after:bg-border sm:[&:not(:last-child)]:after:content-['']">
              {state === 'done' && step.href ? (
                <Link href={step.href} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted" title={`Change ${step.label.toLowerCase()}`}>
                  {body}
                </Link>
              ) : (
                <div
                  className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2', state === 'current' && 'bg-primary/5')}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The three steps for a given position in the flow: hub (nothing chosen), year page, paper page. */
export function samplePaperSteps(examSlug: string, cfg: SamplePaperExamConfig, year?: number, subject?: { name: string; slug: string }): { steps: Step[]; current: number } {
  return {
    current: subject ? 2 : year ? 1 : 0,
    steps: [
      { label: cfg.isBoard ? 'Session' : 'Year', value: year ? periodLabel(cfg, year) : undefined, href: samplePapersPath(examSlug) },
      { label: 'Subject', value: subject?.name, href: year ? samplePapersPath(examSlug, year) : undefined },
      { label: 'Read paper', value: subject ? 'Paper & marking scheme' : undefined },
    ],
  };
}
