import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Same amber-banner visual language as src/app/(app)/dashboard/page.tsx's onboarding
// nudge — extracted here so the homepage and /dashboard aren't maintaining two copies of
// the same message. See prd/homepage-session-aware-revamp.md Section 6.
export function IncompleteProfileBanner({ needsOnboarding }: { needsOnboarding: boolean }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Finish setting up your account</p>
            <p className="mt-0.5 text-sm text-amber-800/90 dark:text-amber-300/90">
              Tell us which exam you&apos;re preparing for so we can personalize this page.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-400 dark:border-amber-700">
          <Link href={needsOnboarding ? '/onboarding' : '/settings'}>Complete setup</Link>
        </Button>
      </div>
    </div>
  );
}
