// Illustrative hero-right visual — server-safe (no hooks), built from divs/gradients like
// home/performance-overview-card.tsx, not a copied image asset.
export function HeroGraphic({ examName }: { examName: string }) {
  const targetYear = new Date().getFullYear() + 1;

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
        <div className="relative h-64 bg-gradient-to-br from-primary/30 via-secondary/20 to-tertiary/10 sm:h-72">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-secondary/20 blur-2xl" aria-hidden="true" />
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 via-foreground/60 to-transparent p-6 pt-16">
          <span className="text-label-caps inline-block rounded-full bg-secondary px-2.5 py-1 uppercase text-secondary-foreground">
            Target {targetYear}
          </span>
          <p className="text-body-lg mt-3 font-semibold text-background">
            Master the core subjects to secure your seat in {examName}.
          </p>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-xl bg-secondary/40" aria-hidden="true" />
      <div className="absolute -right-4 -top-4 h-14 w-14 rounded-xl bg-tertiary/30" aria-hidden="true" />
    </div>
  );
}
