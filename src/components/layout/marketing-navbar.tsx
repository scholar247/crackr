'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/exams', label: 'Exams' },
  { href: '/practice', label: 'Practice' },
  { href: '/blogs', label: 'Blog' },
];

export function MarketingNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLanding = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) return;
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isLanding]);

  // The transparent-over-hero treatment only applies on the landing page while
  // unscrolled; every other route always shows the solid header.
  const showSolidHeader = !isLanding || scrolled;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center border-b transition-all duration-200',
        showSolidHeader ? 'border-border bg-background/95 backdrop-blur' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex shrink-0 items-center">
            <NextImage src="/logo.svg" alt="scholar247" width={144} height={30} className="dark:invert" priority />
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          {session?.user ? (
            <UserMenu showDashboard />
          ) : (
            <Button size="sm" asChild>
              <Link href="/sign-in">Get started free</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
