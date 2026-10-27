import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks, NotebookPen, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfficialSourceNote, RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { CHAPTER_LOOP, NIMCET_PATH, UNIT_TIPS } from '@/content/exams/nimcet/guidance';
import { SYLLABUS_SOURCE } from '@/content/exams/nimcet/syllabus';
import type { NimcetData, NimcetSubject, NimcetUnit } from '@/server/services/exam-landing/nimcet';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';
import { gated, plural } from '../utils';

export function NimcetUnitPage({ data, subject, unit }: { data: NimcetData; subject: NimcetSubject; unit: NimcetUnit }) {
  const tips = UNIT_TIPS[`${subject.slug}/${unit.slug}`] ?? [];
  const index = subject.units.findIndex((u) => u.slug === unit.slug);
  const prev = subject.units[index - 1];
  const next = subject.units[index + 1];
  const chapterTestHref = gated(data.links.buildMock, data.signedIn);

  // Each step of the loop, wired to what exists for this unit right now.
  const steps = [
    { label: CHAPTER_LOOP[0], detail: 'Go through the topic list below and your textbook or notes for each.', href: unit.notesHref, cta: 'Read notes', icon: NotebookPen },
    {
      label: CHAPTER_LOOP[1],
      detail: unit.practiceHref ? `${plural(unit.questionCount, 'question')} available, each with its answer and solution.` : 'Questions for this unit are being added. Use mixed practice meanwhile.',
      href: unit.practiceHref ?? data.links.practice,
      cta: unit.practiceHref ? 'Practise this unit' : 'Mixed practice',
      icon: ListChecks,
    },
    { label: CHAPTER_LOOP[2], detail: 'Build a short timed test for this unit to check speed as well as accuracy.', href: chapterTestHref, cta: data.signedIn ? 'Build a test' : 'Sign in to build', icon: Timer },
    { label: CHAPTER_LOOP[3], detail: 'Open the test result and note why each wrong answer went wrong.', href: gated('/progress', data.signedIn), cta: 'Your results', icon: CheckCircle2 },
    { label: CHAPTER_LOOP[4], detail: 'Come back to this unit after a few days and retest it.', href: `${NIMCET_PATH}/study-plan`, cta: 'Plan revision', icon: ArrowRight },
  ];

  return (
    <NimcetPageShell
      nav="syllabus"
      crumbs={[
        { label: 'Syllabus', href: `${NIMCET_PATH}/syllabus` },
        { label: subject.name, href: subject.href },
        { label: unit.name },
      ]}
      eyebrow={`NIMCET ${subject.name}`}
      title={`${unit.name} for NIMCET`}
      intro={`${plural(unit.topics.length, 'topic')} from the official syllabus, how to approach them, and where to practise.`}
      aside={
        unit.practiceHref ? (
          <Button className="rounded-full" asChild>
            <Link href={unit.practiceHref}>Practise {unit.questionCount} questions</Link>
          </Button>
        ) : undefined
      }
      nextSteps={[{ label: `All ${subject.name} units`, description: 'Back to the subject page', href: subject.href }, STEP.practice, STEP.mocks]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection id="topics" title="Topics in the official syllabus">
          <ul className="space-y-2 rounded-2xl border border-border bg-card p-5">
            {unit.topics.map((t) => (
              <li key={t} className="text-body-md flex gap-2 text-foreground">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <OfficialSourceNote source={SYLLABUS_SOURCE} className="mt-3" />
        </PageSection>

        {tips.length > 0 && (
          <PageSection id="approach" title="How to approach it" action={<RecommendationTag />}>
            <ul className="space-y-3 rounded-2xl border border-border bg-card p-5">
              {tips.map((t) => (
                <li key={t} className="text-body-md flex gap-2 text-muted-foreground">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </PageSection>
        )}
      </div>

      <PageSection id="steps" title="Your next steps for this unit">
        <ol className="grid gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-col rounded-2xl border border-border bg-card p-4">
              <span className="text-label-caps uppercase text-muted-foreground">Step {i + 1}</span>
              <span className="mt-1 font-semibold text-foreground">{s.label}</span>
              <span className="text-body-sm mt-1 flex-1 text-muted-foreground">{s.detail}</span>
              {s.href && (
                <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  <s.icon className="h-4 w-4" aria-hidden /> {s.cta}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </PageSection>

      <nav aria-label={`Other ${subject.name} units`} className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={prev.href} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40">
            <ArrowLeft className="h-4 w-4" /> {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={next.href} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40">
            Next: {next.name} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </NimcetPageShell>
  );
}
