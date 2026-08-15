import { FileSearch, Zap, ScanSearch } from 'lucide-react';

const INSIGHTS = [
  { icon: FileSearch, title: 'Detailed Explanations', description: 'Every question includes a step-by-step breakdown, alternative methods, and conceptual background.' },
  { icon: Zap, title: 'Instant Feedback Loop', description: 'Identify mistakes immediately while the context is fresh, accelerating conceptual understanding.' },
  { icon: ScanSearch, title: 'Micro-Topic Analysis', description: 'We track performance down to specific sub-topics, generating precise heatmaps of your knowledge.' },
];

// Same illustrative-divs bar chart technique as home/performance-overview-card.tsx.
const BAR_HEIGHTS = [45, 55, 90, 40, 30];

function HeatmapMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-tertiary/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary/60" />
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Performance Heatmap view</span>
      </div>

      <div className="mt-6 flex h-48 items-end gap-3 border-b border-border pb-0">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-md ${i === 2 ? 'bg-secondary' : i === 4 ? 'bg-destructive/50' : 'bg-primary/20'}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PracticeInsight() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <h2 className="text-headline-lg text-foreground">
            Beyond mere repetition.
            <br />
            Practice with <span className="italic text-secondary">insight.</span>
          </h2>
          <p className="text-body-md mt-4 max-w-lg text-muted-foreground">
            Our platform doesn&apos;t just tell you if you&apos;re right or wrong. It deconstructs your performance to
            optimize your study time.
          </p>

          <div className="mt-8 space-y-5">
            {INSIGHTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

        <HeatmapMockup />
      </div>
    </section>
  );
}
