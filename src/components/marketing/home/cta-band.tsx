import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CtaBandProps {
  /** A logged-in user doesn't need another sign-up prompt — swap the primary CTA for
   * finishing their profile instead. See prd/homepage-session-aware-revamp.md Section 6. */
  variant?: 'default' | 'incomplete-profile';
}

// A token-only color inversion — bg-foreground/text-background reads as a dark
// navy band with light text in light theme, and automatically flips to a light
// band on the already-dark page in dark theme. No hardcoded colors.
export function CtaBand({ variant = 'default' }: CtaBandProps) {
  const isIncomplete = variant === 'incomplete-profile';

  return (
    <section className="bg-foreground py-20 text-background">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-headline-lg">{isIncomplete ? 'Finish Setting Up Your Prep' : 'Start Preparing Smarter Today'}</h2>
        <p className="text-body-md mt-3 text-background/70">
          {isIncomplete
            ? "Tell us which exam you're targeting and we'll personalize everything from here."
            : 'Structured theory, real practice, and mocks that tell you exactly where you stand. Stop guessing, start measuring.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
            <Link href={isIncomplete ? '/onboarding' : '/sign-in'}>{isIncomplete ? 'Complete Your Profile' : 'Create Free Account'}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-label-caps rounded-full border-background/30 bg-transparent uppercase tracking-wider text-background hover:bg-background/10"
            asChild
          >
            <Link href="/exams">Browse All Exams</Link>
          </Button>
        </div>

        {!isIncomplete && (
          <p className="text-body-sm mt-4 text-background/60">No credit card required. Free forever for core practice.</p>
        )}
      </div>
    </section>
  );
}
