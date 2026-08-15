import type { LucideIcon } from 'lucide-react';

export function PlaceholderTab({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-body-lg font-semibold text-foreground">{label} coming soon</p>
      <p className="text-body-sm max-w-sm text-muted-foreground">
        We&apos;re still building this out — check back soon.
      </p>
    </div>
  );
}
