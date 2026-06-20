'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { Button } from '@/components/ui/button';
import { Flame, ScrollText } from 'lucide-react';
import { usePracticeStore } from '@/stores/practice-store';
import { cn } from '@/lib/utils';

const APP_PREFIXES = [
  '/dashboard', '/practice', '/mocks', '/tests', '/progress',
  '/settings', '/help', '/syllabus', '/study-plan', '/my-courses',
  '/courses', '/onboarding', '/exam', '/admin', '/teacher',
  '/nimcet',
];

// These paths live under an APP_PREFIX but are public marketing pages
const PUBLIC_OVERRIDES = new Set(['/courses', '/courses/nimcet']);

function isAppRoute(pathname: string) {
  if (PUBLIC_OVERRIDES.has(pathname)) return false;
  return APP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export function TopNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { stats } = usePracticeStore();
  const hasStreak = stats.streak >= 3;
  const [scrolled, setScrolled] = useState(false);

  const isPublic = !isAppRoute(pathname);
  const isLanding = pathname === '/';
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (!isLanding) {
      setScrolled(true);
      return;
    }
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isLanding]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center border-b transition-all duration-200',
        isLanding && !scrolled
          ? 'border-transparent bg-transparent'
          : 'border-border bg-background/95 backdrop-blur'
      )}
    >
      {isPublic ? (
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">
          {/* Left – logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center shrink-0">
              <NextImage
                src="/logo.svg"
                alt="scholar247"
                width={144}
                height={30}
                className="dark:invert"
                priority
              />
            </Link>
          </div>

          {/* Center – nav links */}
          <nav className="hidden sm:flex items-center justify-center gap-1">
            <Link
              href="/subjects"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Subjects
            </Link>
            <Link
              href="/exams"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Exams
            </Link>
            <Link
              href="/pyp"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <ScrollText className="h-3.5 w-3.5" />
              PYP
            </Link>
          </nav>

          {/* Right – theme + auth */}
          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <UserMenu showDashboard />
            ) : (
              <>

                <Button size="sm" asChild>
                  <Link href="/sign-in">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full px-4 md:px-6 flex items-center">
          <Link href="/dashboard" className="flex items-center shrink-0">
            <NextImage
              src="/logo.svg"
              alt="scholar247"
              width={96}
              height={29}
              className="dark:invert"
              priority
            />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {hasStreak && (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all',
                  stats.streak >= 10
                    ? 'bg-red-500/15 text-red-500 animate-streak-glow'
                    : stats.streak >= 5
                    ? 'bg-orange-500/15 text-orange-500'
                    : 'bg-amber-500/15 text-amber-500'
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                {stats.streak}
              </div>
            )}
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      )}
    </header>
  );
}
