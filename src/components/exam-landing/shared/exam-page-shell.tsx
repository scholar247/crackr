import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamNavBar } from './exam-nav-bar';
import { Breadcrumbs, type Crumb } from './breadcrumbs';
import { SECTION_HEADING, SECTION_ICONS, sectionGradient } from './exam-nav-icons';

export { SECTION_HEADING };

export interface ExamNavItem {
  key: string;
  label: string;
  href: string;
}

export interface NextStep {
  /** Section key — picks the icon and colour. */
  key?: string;
  label: string;
  description: string;
  href: string;
}

// An exam's section menu (Overview, Syllabus, Practice…): sticky under the site navbar,
// pill-style with icons, scrolling sideways on phones (see ExamNavBar).
export function ExamNav({ label, items, current }: { label: string; items: readonly ExamNavItem[]; current?: string }) {
  return <ExamNavBar label={label} items={items} current={current} />;
}

// Frame for an exam's inner pages: section menu, a header with the section's icon and
// colour (breadcrumbs, the page's single H1, intro), the body, then "where to go next"
// cards so no page is a dead end. `dock` is the phone/tablet bottom bar.
export function ExamPageShell({
  nav,
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  nextStepsTitle,
  nextSteps,
  compact = false,
  sectionKey,
  dock,
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
  /** A slimmer header for tool pages (e.g. a mind map) so the tool starts above the fold. */
  compact?: boolean;
  /** Current section key (icon + accent colour in the header). */
  sectionKey?: string;
  /** Bottom navigation for phones and tablets. */
  dock?: ReactNode;
  children: ReactNode;
}) {
  const Icon = sectionKey ? SECTION_ICONS[sectionKey] : undefined;
  const gradient = sectionGradient(sectionKey);

  return (
    <main className={cn(dock && 'pb-20 lg:pb-0')}>
      {nav}
      <header className="relative overflow-hidden bg-background">
        {/* Decorative: a soft glow in the section's colour and a fading dot grid. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className={cn('absolute -top-32 -right-20 h-72 w-72 rounded-full bg-gradient-to-br opacity-15 blur-3xl', gradient)} />
          <div className="absolute inset-0 [background-image:radial-gradient(color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </div>
        <div className={cn('relative mx-auto max-w-page px-4 sm:px-6 lg:px-8', compact ? 'pt-4 pb-4' : 'pt-5 pb-8 sm:pb-10')}>
          <Breadcrumbs items={crumbs} />
          <div className={cn('flex flex-col lg:flex-row lg:items-end lg:justify-between', compact ? 'mt-3 gap-4' : 'mt-5 gap-6')}>
            <div className={compact ? 'max-w-4xl' : 'max-w-3xl'}>
              {eyebrow && (
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                  {Icon && !compact && (
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', gradient)}>
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  )}
                  {eyebrow}
                </p>
              )}
              <h1
                className={cn(
                  'font-extrabold tracking-tight text-foreground',
                  compact ? 'mt-1 text-2xl leading-tight sm:text-[1.75rem]' : 'mt-3 text-[1.9rem] leading-[1.15] sm:text-4xl lg:text-[2.6rem]',
                )}
              >
                {title}
              </h1>
              {/* Compact: the full intro stays in the page (for readers and search engines), shown in two lines. */}
              <div className={compact ? 'text-body-sm mt-1.5 line-clamp-2 text-muted-foreground' : 'text-body-lg mt-3 text-muted-foreground'}>{intro}</div>
            </div>
            {aside}
          </div>
        </div>
      </header>

      <div className={cn('mx-auto max-w-page space-y-12 pb-14 sm:px-6 lg:px-8', compact ? 'px-2' : 'px-4')}>{children}</div>

      {nextSteps.length > 0 && (
        <section aria-labelledby="next-steps" className="border-t border-border bg-surface-container-lowest">
          <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
            <h2 id="next-steps" className="text-headline-md text-foreground">
              {nextStepsTitle}
            </h2>
            <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nextSteps.map((s) => {
                const StepIcon = s.key ? SECTION_ICONS[s.key] : undefined;
                return (
                  <li key={s.href} className="min-w-0">
                    <Link
                      href={s.href}
                      className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                    >
                      {StepIcon && (
                        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-110', sectionGradient(s.key))}>
                          <StepIcon className="h-5 w-5" aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground group-hover:text-primary">{s.label}</span>
                        <span className="text-body-sm mt-0.5 block text-muted-foreground">{s.description}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
      {dock}
    </main>
  );
}

/** A titled block inside an inner page, with a small colour accent before the heading. */
export function PageSection({ id, title, description, action, children }: { id?: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={headingId} className={SECTION_HEADING}>
            {title}
          </h2>
          {description && <div className="text-body-md mt-1.5 pl-4 text-muted-foreground">{description}</div>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
