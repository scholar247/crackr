import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { NIMCET_PATH, PREP_PRINCIPLES, STRATEGY_PHASES } from '@/content/exams/nimcet/guidance';
import { PATTERN } from '@/content/exams/nimcet/official';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';

// Which page to open next, by where the student is right now.
const BY_STAGE = [
  { who: 'New to NIMCET', next: 'Check eligibility and read the exam pattern, then pick the 90-day plan.', href: `${NIMCET_PATH}/eligibility`, cta: 'Eligibility' },
  { who: 'Know the exam, need structure', next: 'Use the syllabus page as your checklist and follow a study plan unit by unit.', href: `${NIMCET_PATH}/syllabus`, cta: 'Syllabus' },
  { who: 'Want more practice', next: 'Practise unit-wise, then switch to mixed sets so questions arrive in random order like the paper.', href: `${NIMCET_PATH}/practice`, cta: 'Practice' },
  { who: 'Scores have plateaued', next: 'Take full mocks with the official part timings and review every mistake before the next one.', href: `${NIMCET_PATH}/mock-tests`, cta: 'Mock tests' },
];

export function NimcetStrategyPage() {
  const sections = PATTERN.parts.flatMap((p) => p.sections);

  return (
    <NimcetPageShell
      crumbs={[{ label: 'Preparation strategy' }]}
      eyebrow="SyllabuzAI guide"
      title="How to prepare for NIMCET"
      intro="A practical approach built around how NIMCET is actually marked and timed. This is our advice, not official guidance. Adapt it to your own starting point."
      aside={<RecommendationTag />}
      nextSteps={[STEP.studyPlan, STEP.syllabus, STEP.practice]}
    >
      <PageSection id="marks" title="Where the marks are" description={`Official ${PATTERN.year} marks per subject, out of ${PATTERN.totalMarks}.`}>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex h-4 overflow-hidden rounded-full" aria-hidden>
            {sections.map((s, i) => (
              <div key={s.name} className={['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-warning'][i]} style={{ width: `${(s.totalMarks / PATTERN.totalMarks) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-4">
            {sections.map((s, i) => (
              <li key={s.name} className="text-body-sm flex items-start gap-2">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-warning'][i]}`} aria-hidden />
                <span>
                  <Link href={`${NIMCET_PATH}/${s.subjectSlug}`} className="font-medium text-foreground hover:text-primary hover:underline">
                    {s.name}
                  </Link>
                  <span className="block text-muted-foreground">
                    {s.totalMarks} marks ({Math.round((s.totalMarks / PATTERN.totalMarks) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      <PageSection id="principles" title="Four principles">
        <ul className="grid gap-3 sm:grid-cols-2">
          {PREP_PRINCIPLES.map((p) => (
            <li key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{p.title}</h3>
              <p className="text-body-sm mt-1.5 text-muted-foreground">{p.detail}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="phases" title="The four phases of preparation">
        <ol className="grid gap-3 lg:grid-cols-4">
          {STRATEGY_PHASES.map((p, i) => (
            <li key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="text-label-caps uppercase text-muted-foreground">
                Phase {i + 1} · {p.share}
              </span>
              <h3 className="mt-1 font-semibold text-foreground">{p.title}</h3>
              <ul className="mt-3 space-y-2">
                {p.goals.map((g) => (
                  <li key={g} className="text-body-sm flex gap-2 text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary" aria-hidden />
                    {g}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection id="by-stage" title="Where you are → what to do next">
        <ul className="grid gap-3 md:grid-cols-2">
          {BY_STAGE.map((s) => (
            <li key={s.who}>
              <Link href={s.href} className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <span>
                  <span className="block font-semibold text-foreground">{s.who}</span>
                  <span className="text-body-sm mt-1 block text-muted-foreground">{s.next}</span>
                  <span className="mt-2 inline-block text-sm font-semibold text-primary">{s.cta} →</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </NimcetPageShell>
  );
}
