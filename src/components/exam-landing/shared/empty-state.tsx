import type { ReactNode } from 'react';

// Dashed placeholder for a section whose content isn't published yet — always paired with
// an action, so an empty section still moves the student somewhere useful.
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">{icon}</div>
      <div>
        <p className="text-body-lg font-semibold text-foreground">{title}</p>
        <p className="text-body-sm mx-auto mt-1 max-w-md text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
