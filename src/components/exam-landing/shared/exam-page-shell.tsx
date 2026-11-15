import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from './breadcrumbs';

export interface ExamNavItem {
  key: string;
  label: string;
  href: string;
}

export interface NextStep {
  label: string;
  description: string;
  href: string;
}

// An exam's section menu (Overview, Syllabus, Practice…): sticky under the site navbar,
// scrolling sideways on phones rather than wrapping. Each item is a real page link.
export function ExamNav({ label, items, current }: { label: string; items: readonly ExamNavItem[]; current?: string }) {
  return (
    <nav aria-label={label} className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-page gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={current === item.key ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              current === item.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Frame for an exam's inner pages: section menu, breadcrumbs, the page's single H1 and
// intro, the body, then "where to go next" links so no page is a dead end.
export function ExamPageShell({
  nav,
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  nextStepsTitle,
  nextSteps,
  children,
}: {
  nav: ReactNode;
  /** The full trail, starting at Home. */
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  aside?: ReactNode;
  nextStepsTitle: string;
  nextSteps: NextStep[];
  children: ReactNode;
}) {
  return (
    <main>
      {nav}
      <header className="bg-background">
        <div className="mx-auto max-w-page px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow && <p className="text-label-caps uppercase tracking-wider text-primary">{eyebrow}</p>}
              <h1 className="text-headline-xl mt-1 text-foreground max-sm:text-[2rem] max-sm:leading-10">{title}</h1>
              <div className="text-body-lg mt-3 text-muted-foreground">{intro}</div>
            </div>
            {aside}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-page space-y-12 px-4 pb-14 sm:px-6 lg:px-8">{children}</div>

      {nextSteps.length > 0 && (
        <section aria-labelledby="next-steps" className="border-t border-border bg-surface-container-lowest">
          <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
            <h2 id="next-steps" className="text-headline-md text-foreground">
              {nextStepsTitle}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nextSteps.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="group flex h-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span>
                      <span className="block font-semibold text-foreground">{s.label}</span>
                      <span className="text-body-sm mt-1 block text-muted-foreground">{s.description}</span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

/** A titled block inside an inner page. */
export function PageSection({ id, title, description, action, children }: { id?: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={headingId} className="text-headline-md text-foreground">
            {title}
          </h2>
          {description && <div className="text-body-md mt-1.5 text-muted-foreground">{description}</div>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
