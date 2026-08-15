import { Activity, TrendingDown, CheckCircle2 } from 'lucide-react';

// Illustrative dashboard mockup for the hero — no live data, purely a visual
// stand-in showing "what the product feels like" (mirrors QuizPreviewCard's role
// as a static mockup, just for the analytics side of the product instead of MCQs).
const BAR_HEIGHTS = [40, 65, 30, 90, 55];

export function PerformanceOverviewCard() {
  return (
    <div className="relative rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-body-md font-semibold text-foreground">Performance Overview</p>
          <p className="text-body-sm text-muted-foreground">Last 30 Days</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Activity className="h-4 w-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-label-caps uppercase text-muted-foreground">Accuracy</p>
          <p className="text-headline-md mt-1 text-foreground">78.4%</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-secondary" style={{ width: '78%' }} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-label-caps uppercase text-muted-foreground">Avg. Speed</p>
          <p className="text-headline-md mt-1 text-foreground">45s/q</p>
          <p className="mt-3 flex items-center gap-1 text-body-sm text-secondary">
            <TrendingDown className="h-3.5 w-3.5" />
            12% vs last week
          </p>
        </div>
      </div>

      <div className="mt-4 flex h-16 items-end gap-2 rounded-xl border border-border bg-muted/30 p-3">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full ${i === 3 ? 'bg-primary' : 'bg-border'}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-secondary" />
        <div>
          <p className="text-body-sm font-medium text-foreground">Mock Test Completed</p>
          <p className="text-[11px] text-muted-foreground">Rank 42/500</p>
        </div>
      </div>
    </div>
  );
}
