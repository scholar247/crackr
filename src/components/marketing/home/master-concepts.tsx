import { BookOpen, NotebookText, Sigma } from 'lucide-react';

const ITEMS = [
  { icon: BookOpen, title: 'Detailed Theory', description: 'Comprehensive coverage of syllabus topics with clear examples.' },
  { icon: NotebookText, title: 'Revision Notes', description: 'Concise summaries for quick review before exams.' },
  { icon: Sigma, title: 'Formula Sheets', description: 'All critical formulas and shortcuts compiled in one place.' },
];

// Abstract "note document" mockup — deliberately built from plain divs (not an
// image asset) so it inherits theme tokens automatically in both light/dark.
function DocumentMockup() {
  return (
    <div className="relative mx-auto max-w-sm rotate-1 rounded-2xl border border-border bg-card p-5 shadow-2xl transition-transform hover:rotate-0">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-tertiary/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-secondary/60" />
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="h-3 w-3/4 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted" />
        <div className="h-3 w-5/6 rounded-full bg-muted" />
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="h-2.5 w-1/2 rounded-full bg-primary/30" />
        </div>
        <div className="h-3 w-2/3 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function MasterConcepts() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <span className="text-label-caps uppercase tracking-wider text-primary">Learn</span>
          <h2 className="text-headline-lg mt-2 text-foreground">Master the Concepts</h2>
          <p className="text-body-md mt-3 max-w-lg text-muted-foreground">
            Build a strong foundation with our meticulously crafted study materials. We cut through the noise so you can
            focus on what matters.
          </p>

          <div className="mt-8 space-y-5">
            {ITEMS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-body-md font-semibold text-foreground">{title}</p>
                  <p className="text-body-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DocumentMockup />
      </div>
    </section>
  );
}
