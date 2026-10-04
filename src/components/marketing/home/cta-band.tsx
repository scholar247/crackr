import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CtaBandProps {
  /** A logged-in user doesn't need another sign-up prompt — swap the primary CTA for
   * finishing their profile instead. See prd/homepage-session-aware-revamp.md Section 6. */
  variant?: 'default' | 'incomplete-profile';
}

// Sits on the page background rather than as a solid inverted band: a rounded card tinted
// with the theme's own primary/secondary/tertiary at low opacity, so it blends into both
// light and dark themes. Token-only, no hardcoded colors.
export function CtaBand({ variant = 'default' }: CtaBandProps) {
  const isIncomplete = variant === 'incomplete-profile';

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-secondary/10 to-tertiary/10 px-6 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-headline-lg text-foreground">
              {isIncomplete ? 'Finish Setting Up Your Prep' : 'Start Preparing Smarter Today'}
            </h2>
            <p className="text-body-md mt-3 text-muted-foreground">
              {isIncomplete
                ? "Tell us which exam you're targeting and we'll personalize everything from here."
                : 'Structured theory, real practice, and mocks that tell you exactly where you stand. Stop guessing, start measuring.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
                <Link href={isIncomplete ? '/onboarding' : '/sign-in'}>
                  {isIncomplete ? 'Complete Your Profile' : 'Create Free Account'}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-label-caps rounded-full bg-background/60 uppercase tracking-wider backdrop-blur-sm"
                asChild
              >
                <Link href="/exams">Browse All Exams</Link>
              </Button>
            </div>

            {!isIncomplete && (
              <p className="text-body-sm mt-4 text-muted-foreground">No credit card required. Free forever for core practice.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
