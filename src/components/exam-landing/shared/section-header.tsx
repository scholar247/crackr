import type { ReactNode } from 'react';

// Eyebrow + heading + optional description/action — the header every landing section opens with.
export function SectionHeader({
  eyebrow,
  icon,
  title,
  description,
  action,
}: {
  eyebrow: string;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <span className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary">
          {icon}
          {eyebrow}
        </span>
        <h2 className="text-headline-lg mt-1 text-foreground">{title}</h2>
        {description && <p className="text-body-md mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Page section with the shared container, vertical rhythm, and anchor offset for the sticky navs. */
export function LandingSection({
  id,
  muted,
  children,
}: {
  id: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-32 py-14 ${muted ? 'bg-surface-container-lowest' : 'bg-background'}`}>
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
