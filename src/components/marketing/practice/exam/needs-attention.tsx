import { AlertTriangle } from 'lucide-react';

// Illustrative — no attempt-tracking is wired yet. Only rendered when the caller has
// already confirmed a session exists (see page.tsx) — this component doesn't check auth
// itself since it has nothing sensible to show a logged-out visitor.
const WEAK_TOPICS = [
  { name: 'Probability', accuracy: 38 },
  { name: 'Permutations', accuracy: 42 },
];

export function NeedsAttention() {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-body-md font-semibold text-foreground">Needs Attention</p>
      </div>
      <p className="text-body-sm mt-1 text-muted-foreground">Your accuracy in these topics has dropped below 50%.</p>

      <div className="mt-4 space-y-2">
        {WEAK_TOPICS.map((topic) => (
          <div key={topic.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="text-body-sm text-foreground">{topic.name}</span>
            <span className="text-body-sm font-semibold text-destructive">{topic.accuracy}% Accuracy</span>
          </div>
        ))}
      </div>
    </div>
  );
}
