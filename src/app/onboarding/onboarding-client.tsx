'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { defaultDashboardPath } from '@/lib/roles';

export function OnboardingClient({ name }: { name: string }) {
  const { update } = useSession();
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/me/onboarding', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete onboarding');

      const session = await update();
      // Hard navigation, not router.replace(): the (app) layout's onboarding gate reads
      // the session cookie server-side, and a client-side navigation right after
      // useSession().update() isn't guaranteed to carry the freshly-set cookie on the
      // very next request — it was landing back on /onboarding, looking like the button
      // did nothing. A full page load always sees the cookie the browser just stored.
      window.location.href = defaultDashboardPath(session?.user?.role ?? 'STUDENT');
    } catch {
      toast.error('Something went wrong — please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You&apos;re all set — jump into your dashboard and start exploring exams and practice content.
        </p>
        <Button className="mt-6 w-full" size="lg" onClick={handleContinue} disabled={submitting}>
          {submitting ? 'Setting up…' : 'Continue'}
        </Button>
      </div>
    </main>
  );
}
