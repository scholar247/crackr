'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { defaultDashboardPath } from '@/lib/roles';

export function OnboardingClient({ name }: { name: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/me/onboarding', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete onboarding');

      const session = await update();
      router.replace(defaultDashboardPath(session?.user?.role ?? 'STUDENT'));
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
