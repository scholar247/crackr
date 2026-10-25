import Link from 'next/link';
import { ArrowRight, BookOpen, ListChecks, NotebookPen, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfficialSourceNote, RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { CHAPTER_LOOP, NIMCET_PATH, SUBJECT_GUIDANCE } from '@/content/exams/nimcet/guidance';
import { PATTERN } from '@/content/exams/nimcet/official';
import { SYLLABUS_SOURCE } from '@/content/exams/nimcet/syllabus';
import type { NimcetData, NimcetSubject } from '@/server/services/exam-landing/nimcet';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';
import { SUBJECT_ICON, subjectMarks } from '../subject-cards';
import { gated, plural } from '../utils';

export function NimcetSubjectPage({ data, subject }: { data: NimcetData; subject: NimcetSubject }) {
  const guidance = SUBJECT_GUIDANCE[subject.slug];
  const part = PATTERN.parts.find((p) => p.part === subject.part)!;
  const others = data.subjects.filter((s) => s.slug !== subject.slug);
  const chapterTestHref = gated(data.links.buildMock, data.signedIn);

  return (
    <NimcetPageShell
      nav="syllabus"
      crumbs={[{ label: 'Syllabus', href: `${NIMCET_PATH}/syllabus` }, { label: subject.name }]}
      eyebrow={`Part ${subject.part} · ${subject.questions} questions · ${subjectMarks(subject.slug)} marks`}
      title={`NIMCET ${subject.name}`}
      intro={subject.summary}
      aside={
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" asChild>
            <Link href={subject.practiceHref ?? data.links.practice}>{subject.practiceHref ? `Practise ${subject.shortName}` : 'Practise mixed questions'}</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <a href="#units">See units</a>
          </Button>
        </div>
      }
      nextSteps={[STEP.mocks, { ...STEP.overview, label: 'Preparation tracker', description: 'Your mock scores by subject', href: `${NIMCET_PATH}#tracker` }, STEP.syllabus]}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="approach-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="approach-heading" className="text-headline-md text-foreground">
              How to prepare
            </h2>
            <RecommendationTag />
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-4">
              <dt className="text-label-caps uppercase text-muted-foreground">Weight</dt>
              <dd className="text-body-sm mt-1 text-foreground">{guidance.weight}</dd>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <dt className="text-label-caps uppercase text-muted-foreground">Pace in the exam</dt>
              <dd className="text-body-sm mt-1 text-foreground">{guidance.pace}</dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2">
            {guidance.approach.map((a) => (
              <li key={a} className="text-body-md flex gap-2 text-muted-foreground">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{SUBJECT_ICON[subject.slug]}</span>
            <p className="text-label-caps mt-4 uppercase text-muted-foreground">Your progress</p>
            {subject.progress ? (
              <>
                <p className="text-headline-md mt-1 text-foreground">{Math.round(subject.progress.avgPercentage)}% average</p>
                <p className="text-body-sm text-muted-foreground">
                  Best {Math.round(subject.progress.bestPercentage)}% · latest {Math.round(subject.progress.latestPercentage)}% ·{' '}
                  {plural(subject.progress.totalAttempts, 'mock')}
                </p>
                <Link href="/progress" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                  See detailed progress →
                </Link>
              </>
            ) : (
              <>
                <p className="text-body-sm mt-1 text-muted-foreground">
                  {data.signedIn
                    ? `Take a mock with a ${subject.shortName} section and your scores for this subject appear here.`
                    : 'Sign in and take mocks to see your scores for this subject here.'}
                </p>
                <Link href={chapterTestHref} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                  {data.signedIn ? `Build a ${subject.shortName} test →` : 'Sign in →'}
                </Link>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-label-caps uppercase text-muted-foreground">Available now</p>
            <p className="text-body-md mt-1 text-foreground">
              {subject.questionCount > 0 ? plural(subject.questionCount, 'practice question') : 'Practice questions are being added'}
              {subject.articleCount > 0 && <> · {plural(subject.articleCount, 'note')}</>}
            </p>
            {subject.notesHref && (
              <Link href={subject.notesHref} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                Read {subject.shortName} notes →
              </Link>
            )}
            <p className="text-body-sm mt-2 text-muted-foreground">
              Part {part.part} lasts {part.minutes} minutes{part.sections.length > 1 && `, shared with ${part.sections.find((s) => s.subjectSlug !== subject.slug)?.name}`}.
            </p>
          </div>
        </aside>
      </div>

      <PageSection
        id="units"
        title={`${subject.name} units`}
        description={
          <>
            Work through each unit in five steps: {CHAPTER_LOOP.join(' → ')}.
            {subject.groupedBy === 'syllabuzai' && ' Units are our grouping of the official topic list.'}
          </>
        }
      >
        <ol className="space-y-3">
          {subject.units.map((u, i) => (
            <li key={u.slug} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-mono text-sm font-semibold text-secondary">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      <Link href={u.href} className="hover:text-primary hover:underline">
                        {u.name}
                      </Link>
                    </h3>
                    <p className="text-body-sm mt-1 text-muted-foreground">
                      {u.topics.slice(0, 4).join(' · ')}
                      {u.topics.length > 4 && ` · +${u.topics.length - 4} more`}
                    </p>
                  </div>
                </div>
                {/* The chapter loop as actions; a step without content shows its honest fallback. */}
                <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={u.href}>
                      <BookOpen className="h-4 w-4" /> Learn
                    </Link>
                  </Button>
                  {u.practiceHref ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={u.practiceHref}>
                        <ListChecks className="h-4 w-4" /> Practise · {u.questionCount}
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ListChecks className="h-4 w-4" /> Questions soon
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={chapterTestHref}>
                      <Timer className="h-4 w-4" /> Chapter test
                    </Link>
                  </Button>
                  {u.notesHref && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={u.notesHref}>
                        <NotebookPen className="h-4 w-4" /> Notes
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-body-sm mt-4 flex items-start gap-2 text-muted-foreground">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          After a chapter test, open its result to review every wrong answer, then revise that unit before retesting.
        </p>
        <OfficialSourceNote source={SYLLABUS_SOURCE} className="mt-3" />
      </PageSection>

      <PageSection id="other-subjects" title="Other NIMCET subjects">
        <ul className="grid gap-3 sm:grid-cols-3">
          {others.map((s) => (
            <li key={s.slug}>
              <Link href={s.href} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <span>
                  <span className="block font-medium text-foreground">{s.name}</span>
                  <span className="text-body-sm text-muted-foreground">
                    {s.questions} questions · {s.units.length} units
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </NimcetPageShell>
  );
}
