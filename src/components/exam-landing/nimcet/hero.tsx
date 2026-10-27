import Link from 'next/link';
import { BookOpenCheck, ClipboardCheck, FileSearch, ListChecks, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/exam-landing/shared/breadcrumbs';
import { INSTITUTES_2026, PATTERN } from '@/content/exams/nimcet/official';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';

// The five stages the rest of the page (and the NIMCET section) is organised around. Each
// stage opens the place that does that job.
const JOURNEY = [
  { icon: FileSearch, label: 'Understand the exam', detail: 'Pattern and eligibility', href: `${NIMCET_PATH}/exam-pattern` },
  { icon: BookOpenCheck, label: 'Learn the syllabus', detail: 'Subject by subject, unit by unit', href: `${NIMCET_PATH}/syllabus` },
  { icon: ListChecks, label: 'Practise questions', detail: 'Unit-wise MCQs with solutions', href: `${NIMCET_PATH}/practice` },
  { icon: ClipboardCheck, label: 'Take timed mocks', detail: 'Three parts, fixed timing', href: `${NIMCET_PATH}/mock-tests` },
  { icon: RotateCcw, label: 'Review and revise', detail: 'Fix weak units, then retest', href: `${NIMCET_PATH}/study-plan` },
];

export function NimcetHero({ questionCount }: { questionCount: number }) {
  const facts = [
    { value: PATTERN.totalQuestions, label: 'MCQs' },
    { value: PATTERN.totalMarks.toLocaleString('en-IN'), label: 'Marks' },
    { value: `${PATTERN.durationMinutes / 60} hrs`, label: 'Three timed parts' },
    { value: INSTITUTES_2026.institutes.length, label: 'NITs & IIITs' },
  ];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-page px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Exams', href: '/exams' }, { label: 'NIMCET' }]} />
      </div>

      <div className="mx-auto grid max-w-page gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-10 lg:px-8 lg:py-12">
        <div>
          <span className="text-label-caps inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 uppercase text-secondary">
            NIT MCA Common Entrance Test
          </span>
          <h1 className="text-display-lg mt-4 text-foreground max-sm:text-[2rem] max-sm:leading-10">
            NIMCET preparation, organised from syllabus to mock test
          </h1>
          <p className="text-body-lg mt-4 max-w-xl text-muted-foreground">
            Work through the official {PATTERN.year} syllabus unit by unit, practise MCQs with worked solutions, and take mocks timed like the real
            three-part paper{questionCount > 0 && <> with {questionCount.toLocaleString('en-IN')} NIMCET practice questions ready now</>}.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={`${NIMCET_PATH}/study-plan`}>Start preparing</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <a href="#syllabus">Explore syllabus</a>
            </Button>
            <Link href={`${NIMCET_PATH}/eligibility`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Check eligibility →
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl border border-border bg-card px-4 py-3">
                <dd className="text-headline-md text-foreground">{f.value}</dd>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Pattern and institutes as per the official NIMCET {PATTERN.year} brochure.</p>
        </div>

        <aside aria-labelledby="journey-heading" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 id="journey-heading" className="text-label-caps uppercase tracking-wider text-muted-foreground">
            Your preparation path
          </h2>
          <ol className="relative mt-4 space-y-1">
            {JOURNEY.map((step, i) => (
              <li key={step.label}>
                <Link href={step.href} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-primary/5">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" aria-hidden />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                      {i + 1}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground group-hover:text-primary">{step.label}</span>
                    <span className="text-body-sm block text-muted-foreground">{step.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
