import Link from 'next/link';
import { ArrowRight, Zap, ListTree, History, FileText } from 'lucide-react';

const MODES = [
  { icon: Zap, title: 'Quick 10', description: 'A rapid-fire mix of 10 random questions to keep your mind sharp.', cta: 'Start' },
  { icon: ListTree, title: 'By Topic', description: 'Focus on specific areas. Choose from 120+ micro-topics.', cta: 'Browse Topics' },
  { icon: History, title: 'PYQs', description: 'Previous Year Questions to build exam-day familiarity.', cta: 'View Papers' },
  { icon: FileText, title: 'Full Mock', description: 'Simulate the real exam environment under timed conditions.', cta: 'Take Test' },
];

export function PracticeModeCards({ examSlug }: { examSlug: string }) {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Select Practice Mode</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map(({ icon: Icon, title, description, cta }) => (
            <Link
              key={title}
              href={`/practice/exams/${examSlug}/questions`}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-body-md mt-3 font-semibold text-foreground">{title}</p>
              <p className="text-body-sm mt-1 flex-1 text-muted-foreground">{description}</p>
              <span className="text-body-sm mt-4 flex items-center gap-1 font-medium text-primary">
                {cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
