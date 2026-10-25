import Link from 'next/link';
import { ArrowRight, CalendarRange } from 'lucide-react';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { DAILY_ROUTINE, NIMCET_PATH, STUDY_PLANS } from '@/content/exams/nimcet/guidance';

export function StudyPlanTeaser() {
  return (
    <LandingSection id="plan" muted>
      <SectionHeader
        eyebrow="Study plan"
        icon={<CalendarRange className="h-3.5 w-3.5" />}
        title="Pick a plan that fits your time"
        description="Three ready schedules, each linking every task to the unit you should study. Choose by how much time you have, not by a target rank."
        action={<RecommendationTag />}
      />

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {STUDY_PLANS.map((p) => (
          <li key={p.days}>
            <Link
              href={`${NIMCET_PATH}/study-plan#plan-${p.days}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-display-lg leading-none text-foreground max-sm:text-[2.25rem]">{p.days}</span>
              <span className="text-label-caps mt-1 uppercase text-muted-foreground">days · {p.hoursPerDay}</span>
              <span className="text-body-sm mt-3 block flex-1 text-muted-foreground">{p.for}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View {p.label.toLowerCase()} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground">A typical study day</h3>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DAILY_ROUTINE.map((r, i) => (
            <li key={r.slot} className="text-body-sm flex gap-3 text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-mono text-xs font-semibold text-secondary">{i + 1}</span>
              <span>
                <span className="block font-medium text-foreground">{r.slot}</span>
                {r.task}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </LandingSection>
  );
}
