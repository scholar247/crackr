import Link from 'next/link';
import { ArrowRight, BellRing, Dumbbell, FileText, GraduationCap } from 'lucide-react';

/**
 * The hub's state before any paper is published for an exam: explains the wait and points
 * to what can be done today, instead of a 404. (The page also sets noindex — see
 * emptyHubMetadata — so empty hubs never compete in search.)
 */
export function SamplePapersEmpty({ examSlug, examLabel }: { examSlug: string; examLabel: string }) {
  const actions = [
    { href: `/practice/exams/${examSlug}`, icon: Dumbbell, title: 'Practise questions', description: 'Chapter-wise questions with worked solutions' },
    { href: '/mocks', icon: FileText, title: 'Take a mock test', description: 'Timed tests on the exam pattern' },
    { href: `/exams/${examSlug}`, icon: GraduationCap, title: `${examLabel} overview`, description: 'Syllabus, pattern and preparation guide' },
  ];

  return (
    <section aria-labelledby="empty-heading" className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center sm:px-10">
      <span aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto flex h-20 w-16 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 -translate-x-2 -rotate-6 rounded-lg border border-border bg-surface-container-lowest" />
        <span className="absolute inset-0 translate-x-2 rotate-6 rounded-lg border border-border bg-surface-container-lowest" />
        <span className="absolute inset-0 flex items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <BellRing className="h-6 w-6" />
        </span>
      </div>

      <h2 id="empty-heading" className="text-headline-md relative mt-6 text-foreground">
        {examLabel} sample papers are on the way
      </h2>
      <p className="text-body-md relative mx-auto mt-2 max-w-lg text-muted-foreground">
        We add official sample papers and marking schemes as soon as they’re released. Until then, keep your preparation moving with these:
      </p>

      <ul className="relative mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <a.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
                  {a.title}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="text-body-sm mt-0.5 block text-muted-foreground">{a.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
