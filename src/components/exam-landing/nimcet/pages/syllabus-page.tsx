import Link from 'next/link';
import { ChevronDown, ListChecks } from 'lucide-react';
import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { SYLLABUS_EFFECTIVE_FROM, SYLLABUS_SOURCE, TOTAL_TOPICS, TOTAL_UNITS } from '@/content/exams/nimcet/syllabus';
import type { NimcetData } from '@/server/services/exam-landing/nimcet';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';
import { SubjectCards } from '../subject-cards';

// Fully server-rendered (native <details>) so every topic is in the HTML, unlike the
// collapsed interactive explorer on the hub page.
export function NimcetSyllabusPage({ data }: { data: NimcetData }) {
  return (
    <NimcetPageShell
      nav="syllabus"
      crumbs={[{ label: 'Syllabus' }]}
      eyebrow={`Official · revised syllabus, ${SYLLABUS_EFFECTIVE_FROM} onwards`}
      title="NIMCET syllabus"
      intro={`All ${TOTAL_TOPICS} topics in the official NIMCET syllabus, across ${TOTAL_UNITS} units in four subjects, with links to study and practise each unit.`}
      aside={<OfficialSourceNote source={SYLLABUS_SOURCE} className="lg:max-w-xs" />}
      nextSteps={[STEP.pattern, STEP.studyPlan, STEP.practice]}
    >
      <PageSection id="subjects" title="Subjects at a glance">
        <SubjectCards subjects={data.subjects} />
      </PageSection>

      {data.subjects.map((s) => (
        <PageSection
          key={s.slug}
          id={s.slug}
          title={`${s.name} (${s.questions} questions)`}
          description={
            s.groupedBy === 'syllabuzai'
              ? 'The official syllabus lists these topics as one list. We have grouped them into units to make studying easier; the topics themselves are unchanged.'
              : s.summary
          }
          action={
            <Link href={s.href} className="text-sm font-semibold text-primary hover:underline">
              {s.name} page →
            </Link>
          }
        >
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {s.units.map((u) => (
              <details key={u.slug} open className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <h3 className="font-semibold text-foreground">{u.name}</h3>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {u.topics.map((t) => (
                    <li key={t} className="text-body-sm flex gap-2 text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <Link href={u.href} className="font-semibold text-primary hover:underline">
                    Study {u.name} →
                  </Link>
                  {u.practiceHref && (
                    <Link href={u.practiceHref} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                      <ListChecks className="h-4 w-4" aria-hidden /> Practise {u.questionCount} questions
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </PageSection>
      ))}
    </NimcetPageShell>
  );
}
