'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { LiveDot } from '@/components/marketing/live-dot';

async function fetchPrimaryExam(): Promise<{ examName: string } | null> {
  const res = await fetch('/api/v1/me/primary-exam');
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

// Client component, same convention as marketing-navbar.tsx's useSession() check — not a
// server-side auth() call. onboardingCompleted is already in the JWT session, so only the
// primary exam *name* needs a fetch, and only for logged-in, onboarded users. Keeping this
// off the server-rendering path means /about, /contact, /privacy-policy, /terms etc. (this
// bar's siblings under the marketing layout) stay statically prerendered instead of being
// forced dynamic just to personalize one line of text.
export function AnnouncementBar() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const onboardingCompleted = !!session?.user?.onboardingCompleted;

  const { data: primary, isLoading: primaryLoading } = useQuery({
    queryKey: ['me-primary-exam'],
    queryFn: fetchPrimaryExam,
    enabled: isLoggedIn && onboardingCompleted,
    staleTime: 5 * 60 * 1000,
  });

  let message = 'NIMCET, GATE, CUET & CBSE test series are live — start practicing free';
  let href = '/sign-in';

  if (isLoggedIn) {
    if (!onboardingCompleted) {
      message = "Tell us which exam you're targeting — get a personalized prep hub in under a minute";
      href = '/onboarding';
    } else if (primaryLoading) {
      message = 'Welcome back — loading your prep hub…';
      href = '/';
    } else if (primary) {
      message = `Your ${primary.examName} prep hub is ready — mocks, fresh reading & more`;
      href = '/';
    } else {
      // Onboarded, but no exam target set (or one that's since been archived) — same edge
      // case the homepage's own incomplete-profile branch handles.
      message = "Pick an exam to target — get a personalized prep hub in under a minute";
      href = '/settings';
    }
  }

  return (
    <div className="border-b border-border bg-surface-container-low/60 py-1.5 text-center backdrop-blur-md">
      <Link
        href={href}
        className="text-label-caps inline-flex items-center gap-2 uppercase tracking-widest text-secondary transition-colors hover:text-secondary/80"
      >
        <LiveDot />
        {message}
      </Link>
    </div>
  );
}
