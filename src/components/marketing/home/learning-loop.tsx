import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PageCard } from '@/server/repositories/page-card.repository';
import { cn } from '@/lib/utils';

// Admin picks a tone; each maps to an existing theme token. Full class strings so
// Tailwind can see them at build time.
const ACCENT_STYLES: Record<PageCard['accent'], { bar: string; number: string; badge: string; check: string; cta: string }> = {
  PRIMARY: {
    bar: 'bg-primary',
    number: 'text-primary/30',
    badge: 'bg-primary/10 text-primary',
    check: 'text-primary',
    cta: 'text-primary',
  },
  SECONDARY: {
    bar: 'bg-secondary',
    number: 'text-secondary/30',
    badge: 'bg-secondary/10 text-secondary',
    check: 'text-secondary',
    cta: 'text-secondary',
  },
  TERTIARY: {
    bar: 'bg-tertiary',
    number: 'text-tertiary/30',
    badge: 'bg-tertiary/10 text-tertiary',
    check: 'text-tertiary',
    cta: 'text-tertiary',
  },
};

function CardCta({ card }: { card: PageCard }) {
  if (!card.ctaLabel || !card.ctaLink) return null;
  const styles = ACCENT_STYLES[card.accent];

  if (card.ctaType === 'BUTTON') {
    return (
      <Button className="mt-auto w-full rounded-full" asChild>
        <Link href={card.ctaLink}>
          {card.ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    );
  }
  return (
    <Link href={card.ctaLink} className={cn('mt-auto inline-flex items-center justify-between text-sm font-semibold hover:underline', styles.cta)}>
      {card.ctaLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

// Renders whatever active cards the admin has configured for this page/section — the
// section disappears entirely when none are active, rather than showing an empty shell.
export function LearningLoop({ cards }: { cards: PageCard[] }) {
  if (cards.length === 0) return null;

  return (
    <section className="bg-muted/40 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-label-caps uppercase tracking-wider text-primary">The preparation loop</p>
          <h2 className="text-headline-lg mt-2 text-foreground">Learn it. Drill it. Test it.</h2>
          <p className="text-body-md mt-2 text-muted-foreground">
            Every stage feeds the next — no step skipped, no guesswork about what to do next.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const styles = ACCENT_STYLES[card.accent];
            return (
              <article
                key={card.id}
                className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className={cn('absolute inset-x-0 top-0 h-1', styles.bar)} aria-hidden="true" />
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('text-headline font-bold tabular-nums', styles.number)}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {card.badge && (
                    <span className={cn(' text-sm rounded-full px-2 py-1 font-semibold uppercase tracking-wider', styles.badge)}>
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-headline-md text-foreground">{card.title}</h3>
                {card.description && <p className="text-body-sm text-muted-foreground">{card.description}</p>}

                {card.listItems && card.listItems.length > 0 && (
                  <ul className="space-y-2">
                    {card.listItems.map((item) => (
                      <li key={item} className="text-body-sm flex items-start gap-2 text-foreground">
                        <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', styles.check)} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                <CardCta card={card} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
