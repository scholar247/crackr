import Link from 'next/link';
import { OfficialSourceNote, RecommendationTag } from '@/components/exam-landing/shared/source-note';
import { CYCLE_2026, NEXT_CYCLE, PATTERN, QUALIFYING } from '@/content/exams/nimcet/official';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { NimcetPageShell, PageSection, STEP } from '../page-shell';

function marks(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function NimcetExamPatternPage() {
  const sections = PATTERN.parts.flatMap((p) => p.sections.map((s) => ({ ...s, part: p })));

  return (
    <NimcetPageShell
      nav="exam-pattern"
      crumbs={[{ label: 'Exam pattern' }]}
      eyebrow={`Official · NIMCET ${PATTERN.year}`}
      title="NIMCET exam pattern and marking scheme"
      intro={
        <>
          {PATTERN.totalQuestions} multiple-choice questions in three timed parts over {PATTERN.durationMinutes / 60} hours, for a total of{' '}
          {PATTERN.totalMarks} marks. Here is how each part is timed and marked, and how ranks are decided.
        </>
      }
      aside={<OfficialSourceNote source={PATTERN.source} className="lg:max-w-xs" />}
      nextSteps={[STEP.syllabus, STEP.strategy, STEP.mocks]}
    >
      <PageSection id="parts" title="Parts, timing and marks" description="Each part has its own fixed time. You cannot go back to an earlier part or move ahead early.">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">NIMCET {PATTERN.year} parts, timing and marking</caption>
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Part (time)</th>
                <th scope="col" className="px-4 py-3 font-medium">Subject</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Questions</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Correct</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Wrong</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Total marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sections.map((s) => (
                <tr key={s.name}>
                  <td className="px-4 py-3 text-muted-foreground">
                    Part {s.part.part} · {s.part.minutes} min
                    <span className="block text-xs">{s.part.slot}</span>
                  </td>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    <Link href={`${NIMCET_PATH}/${s.subjectSlug}`} className="hover:text-primary hover:underline">
                      {s.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">{s.questions}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">+{s.correct}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">−{marks(s.wrong)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{s.totalMarks}</td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-4 py-3">{PATTERN.durationMinutes} min</td>
                <th scope="row" className="px-4 py-3 text-left">Total</th>
                <td className="px-4 py-3 text-right tabular-nums">{PATTERN.totalQuestions}</td>
                <td colSpan={2} />
                <td className="px-4 py-3 text-right tabular-nums">{PATTERN.totalMarks}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="text-body-md mt-4 grid gap-2 text-muted-foreground sm:grid-cols-2">
          {[`Mode: ${PATTERN.mode}.`, `Language: ${PATTERN.language}.`, `Each question has ${PATTERN.optionsPerQuestion} options.`, PATTERN.negativeRule, ...PATTERN.rules].map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="time" title="Time per question" description={<RecommendationTag />}>
        <p className="text-body-md text-muted-foreground">
          Our working from the official timings. Practise each part against these numbers, because spare time cannot be carried from one part to the next.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {PATTERN.parts.map((p) => {
            const qs = p.sections.reduce((n, s) => n + s.questions, 0);
            return (
              <li key={p.part} className="rounded-xl border border-border bg-card p-5">
                <p className="text-label-caps uppercase text-muted-foreground">Part {p.part}</p>
                <p className="text-headline-md mt-1 text-foreground">~{Math.round((p.minutes * 60) / qs)} s</p>
                <p className="text-body-sm text-muted-foreground">
                  per question · {qs} questions in {p.minutes} min
                </p>
              </li>
            );
          })}
        </ul>
      </PageSection>

      <PageSection id="ranking" title="Qualifying and ranking rules">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="font-semibold text-foreground">Disqualification</p>
            <p className="text-body-sm mt-1 text-muted-foreground">{QUALIFYING.disqualification}</p>
            <p className="font-semibold mt-4 text-foreground">Ranking</p>
            <p className="text-body-sm mt-1 text-muted-foreground">{QUALIFYING.ranking}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold text-foreground">If two candidates tie, in this order</p>
            <ol className="text-body-sm mt-2 space-y-1.5 text-muted-foreground">
              {QUALIFYING.tieBreakers.map((t, i) => (
                <li key={t} className="flex gap-2">
                  <span className="font-mono font-semibold text-secondary">{i + 1}.</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </PageSection>

      <PageSection id="cities" title={`Test cities in ${PATTERN.year}`} description={`${CYCLE_2026.testCities.length} cities. The list can change from year to year.`}>
        <ul className="flex flex-wrap gap-2">
          {CYCLE_2026.testCities.map((c) => (
            <li key={c} className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground">
              {c}
            </li>
          ))}
        </ul>
        <p className="text-body-sm mt-4 text-muted-foreground">{NEXT_CYCLE.note}</p>
      </PageSection>
    </NimcetPageShell>
  );
}
