import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { DAILY_ROUTINE, STUDY_PLANS, WEEKLY_GOALS } from '@/content/exams/nimcet/guidance';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';
import { gated } from '../utils';

// Plans are reference schedules: there's no saved-plan backend yet, so nothing here offers
// checkboxes that would look persistent. Real tracking comes from mock attempts (/progress).
export function NimcetStudyPlanPage({ signedIn }: { signedIn: boolean }) {
  return (
    <NimcetPageShell
      nav="study-plan"
      crumbs={[{ label: 'Study plan' }]}
      eyebrow="SyllabuzAI guide"
      title="NIMCET study plans: 30, 60 and 90 days"
      intro="Pick the plan that matches the time you have. Every task links to the unit or tool you need. These are suggested schedules, not official requirements, and no plan length guarantees a rank."
      aside={
        <nav aria-label="Choose a plan" className="flex gap-2">
          {STUDY_PLANS.map((p) => (
            <a key={p.days} href={`#plan-${p.days}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary">
              {p.days} days
            </a>
          ))}
        </nav>
      }
      nextSteps={[STEP.strategy, STEP.practice, STEP.mocks]}
    >
      <div className="text-body-sm flex gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Saving a plan and ticking off tasks is not available yet. Your progress is tracked through mock tests: every mock you submit is saved to{' '}
          <Link href={gated('/progress', signedIn)} className="font-medium text-primary hover:underline">
            your progress page
          </Link>
          .
        </p>
      </div>

      {STUDY_PLANS.map((plan) => (
        <PageSection
          key={plan.days}
          id={`plan-${plan.days}`}
          title={plan.label}
          description={
            <>
              {plan.for} About {plan.hoursPerDay} a day.
            </>
          }
          action={<RecommendationTag />}
        >
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {plan.blocks.map((b) => (
              <li key={b.days} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <span className="text-label-caps uppercase text-secondary">{b.days}</span>
                <h3 className="mt-1 font-semibold text-foreground">{b.title}</h3>
                <ul className="mt-3 space-y-2">
                  {b.tasks.map((t) => (
                    <li key={t.label}>
                      <Link href={t.href} className="group text-body-sm flex items-start gap-2 text-foreground hover:text-primary">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </PageSection>
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection id="daily" title="Daily goals">
          <ol className="space-y-3 rounded-2xl border border-border bg-card p-5">
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
        </PageSection>
        <PageSection id="weekly" title="Weekly goals">
          <ul className="space-y-3 rounded-2xl border border-border bg-card p-5">
            {WEEKLY_GOALS.map((g) => (
              <li key={g} className="text-body-sm flex gap-2 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary" aria-hidden />
                {g}
              </li>
            ))}
          </ul>
        </PageSection>
      </div>
    </NimcetPageShell>
  );
}
