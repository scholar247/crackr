import Link from 'next/link';
import { ArrowRight, CalendarClock, ExternalLink, Info } from 'lucide-react';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { CYCLE_2026, NEXT_CYCLE, PATTERN, SOURCES } from '@/content/exams/nimcet/official';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';

const LINKS = [
  { label: 'Exam overview & pattern', detail: 'Parts, timing, marking, ranking', href: `${NIMCET_PATH}/exam-pattern` },
  { label: 'Eligibility criteria', detail: 'Degree, minimum marks, documents', href: `${NIMCET_PATH}/eligibility` },
  { label: 'Complete syllabus', detail: 'Every official topic by unit', href: `${NIMCET_PATH}/syllabus` },
];

// Official facts only, each traceable to the brochure. Advice starts in the next section.
export function ExamOverview() {
  return (
    <LandingSection id="overview">
      <SectionHeader
        eyebrow="About the exam"
        icon={<Info className="h-3.5 w-3.5" />}
        title="What NIMCET is"
        description={
          <>
            NIMCET is the national entrance test for the MCA programme at participating NITs and IIITs. Admission to these institutes is based on
            the NIMCET rank alone. The {PATTERN.year} test was coordinated by {CYCLE_2026.coordinatedBy}.
          </>
        }
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">NIMCET {PATTERN.year} test pattern</caption>
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Part</th>
                <th scope="col" className="px-4 py-3 font-medium">Subject</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Qs</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PATTERN.parts.flatMap((p) =>
                p.sections.map((s, i) => (
                  <tr key={s.name}>
                    <td className="px-4 py-3 align-top text-muted-foreground">{i === 0 ? `${p.part} · ${p.minutes} min` : ''}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`${NIMCET_PATH}/${s.subjectSlug}`} className="hover:text-primary hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{s.questions}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{s.totalMarks}</td>
                  </tr>
                )),
              )}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-4 py-3 text-foreground">{PATTERN.durationMinutes} min</td>
                <td className="px-4 py-3 text-foreground">Total</td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">{PATTERN.totalQuestions}</td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">{PATTERN.totalMarks}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-body-sm border-t border-border px-4 py-3 text-muted-foreground">
            {PATTERN.mode}, questions in {PATTERN.language.toLowerCase()}. {PATTERN.negativeRule}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">NIMCET {NEXT_CYCLE.year} dates</p>
              <p className="text-body-sm mt-1 text-muted-foreground">{NEXT_CYCLE.note}</p>
            </div>
          </div>
          <ul className="grid gap-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <span>
                    <span className="block font-medium text-foreground">{l.label}</span>
                    <span className="text-body-sm text-muted-foreground">{l.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>
            ))}
            {[SOURCES.brochure2026, SOURCES.site].map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                >
                  {s.label}
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <OfficialSourceNote source={SOURCES.brochure2026} className="mt-4" />
    </LandingSection>
  );
}
