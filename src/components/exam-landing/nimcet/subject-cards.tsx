import Link from 'next/link';
import { Binary, Brain, Calculator, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PATTERN } from '@/content/exams/nimcet/official';
import type { NimcetSubject } from '@/server/services/exam-landing/nimcet';
import { plural } from './utils';

export const SUBJECT_ICON: Record<string, React.ReactNode> = {
  mathematics: <Calculator className="h-5 w-5" />,
  'logical-reasoning': <Brain className="h-5 w-5" />,
  'computer-awareness': <Binary className="h-5 w-5" />,
  'general-english': <Languages className="h-5 w-5" />,
};

export function subjectMarks(slug: string) {
  return PATTERN.parts.flatMap((p) => p.sections).find((s) => s.subjectSlug === slug)?.totalMarks ?? 0;
}

// One card per official subject: what it covers, what it's worth, what SyllabuzAI has for it
// right now, and — for a signed-in student with mock attempts — their own score.
export function SubjectCards({ subjects, headingLevel = 'h3' }: { subjects: NimcetSubject[]; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {subjects.map((s) => {
        const topics = s.units.reduce((n, u) => n + u.topics.length, 0);
        const marks = subjectMarks(s.slug);
        return (
          <li key={s.slug} className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{SUBJECT_ICON[s.slug]}</span>
              <span className="text-label-caps rounded-full bg-muted px-2.5 py-1 uppercase text-muted-foreground">
                Part {s.part} · {s.questions} Qs · {marks} marks
              </span>
            </div>
            <Heading className="text-body-lg mt-4 font-semibold text-foreground">
              <Link href={s.href} className="hover:text-primary">
                {s.name}
              </Link>
            </Heading>
            <p className="text-body-sm mt-1.5 text-muted-foreground">{s.summary}</p>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Units', value: s.units.length },
                { label: 'Topics', value: topics },
                { label: 'Questions', value: s.questionCount },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-muted/50 px-2 py-2">
                  <dd className="font-semibold tabular-nums text-foreground">{m.value.toLocaleString('en-IN')}</dd>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</dt>
                </div>
              ))}
            </dl>

            {s.progress && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Your mock average in {s.shortName}</span>
                  <span className="font-semibold text-foreground">{Math.round(s.progress.avgPercentage)}%</span>
                </div>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`Your average mock score in ${s.name}`}
                  aria-valuenow={Math.round(s.progress.avgPercentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(100, Math.max(0, s.progress.avgPercentage))}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">From {plural(s.progress.totalAttempts, 'mock attempt')}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2 pt-1">
              <Button size="sm" className="rounded-full" asChild>
                <Link href={s.href}>Explore {s.shortName}</Link>
              </Button>
              {s.practiceHref ? (
                <Button size="sm" variant="outline" className="rounded-full" asChild>
                  <Link href={s.practiceHref}>Practise questions</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full" disabled>
                  Questions coming soon
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
