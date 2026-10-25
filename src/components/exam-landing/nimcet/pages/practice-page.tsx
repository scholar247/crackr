import Link from 'next/link';
import { Info, ListChecks, Shuffle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyPractice } from '@/components/marketing/home/daily-practice';
import type { NimcetData } from '@/server/services/exam-landing/nimcet';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';
import { gated, plural } from '../utils';

export function NimcetPracticePage({ data }: { data: NimcetData }) {
  const { subjects, stats, links, signedIn } = data;

  return (
    <NimcetPageShell
      nav="practice"
      crumbs={[{ label: 'Practice' }]}
      eyebrow="Practice"
      title="NIMCET practice questions"
      intro={
        stats.mcqs > 0
          ? `${plural(stats.mcqs, 'published NIMCET question')}${stats.pyqs > 0 ? `, including ${plural(stats.pyqs, 'previous year question')}` : ''}. Practise by unit, mix subjects, or build a timed chapter test.`
          : 'Practise by unit, mix subjects, or build a timed chapter test.'
      }
      aside={
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" asChild>
            <Link href={links.practice}>
              <Shuffle className="h-4 w-4" /> Mixed practice
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href={gated(links.buildMock, signedIn)}>
              <Timer className="h-4 w-4" /> Chapter test
            </Link>
          </Button>
        </div>
      }
      nextSteps={[STEP.mocks, STEP.syllabus, STEP.studyPlan]}
    >
      <div className="text-body-sm flex gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Practice is free and open to everyone. Answers in practice mode are not saved. To get a saved, scored result, take a chapter test or mock
          {signedIn ? '' : ' after signing in'}.
        </p>
      </div>

      <PageSection id="by-unit" title="Practise by subject and unit" description="Units with no questions yet are marked, so no link leads to an empty set.">
        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map((s) => (
            <section key={s.slug} aria-labelledby={`p-${s.slug}`} className="rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <h3 id={`p-${s.slug}`} className="font-semibold text-foreground">
                    <Link href={s.href} className="hover:text-primary hover:underline">
                      {s.name}
                    </Link>
                  </h3>
                  <p className="text-body-sm text-muted-foreground">{s.questionCount > 0 ? plural(s.questionCount, 'question') : 'Questions coming soon'}</p>
                </div>
                {s.practiceHref && (
                  <Button size="sm" variant="outline" className="rounded-full" asChild>
                    <Link href={s.practiceHref}>Practise all</Link>
                  </Button>
                )}
              </div>
              <ul className="divide-y divide-border">
                {s.units.map((u) => (
                  <li key={u.slug} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link href={u.href} className="text-body-sm min-w-0 font-medium text-foreground hover:text-primary hover:underline">
                      {u.name}
                    </Link>
                    {u.practiceHref ? (
                      <Link href={u.practiceHref} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        <ListChecks className="h-4 w-4" aria-hidden /> {u.questionCount} Qs
                      </Link>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">Coming soon</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PageSection>

      <PageSection id="daily" title="Question of the day">
        <DailyPractice examName="NIMCET" examSlug={data.exam.slug} problem={data.dailyProblem} practiceHref={links.practice} />
      </PageSection>
    </NimcetPageShell>
  );
}
