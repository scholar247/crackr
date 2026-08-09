import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { auth } from '@/lib/auth';
import { userRepository } from '@/server/repositories/user.repository';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const session = await auth();

  // Deliberately not session.user.onboardingCompleted — that's cached in the JWT and
  // only refreshes on next full sign-in or a successful client-side session.update()
  // call. The latter can silently fail (seen in practice as a ClientFetchError), which
  // left this nudge showing indefinitely after a user had actually completed onboarding.
  // A direct DB read is cheap and always correct, same reasoning as requireAuth().
  const snapshot = session?.user ? await userRepository.getAuthorizationSnapshot(session.user.id) : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Your practice, mocks, and progress will show up here as those modules come online.
      </p>

      {!snapshot?.onboardingCompleted && (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Finish setting up your account</p>
              <p className="mt-0.5 text-sm text-amber-800/90 dark:text-amber-300/90">
                Tell us which exam you&apos;re preparing for so we can curate content for you.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-400 dark:border-amber-700">
            <Link href="/onboarding">Complete setup</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
