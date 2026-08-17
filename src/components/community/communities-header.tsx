'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { NotificationBell } from '@/components/community/notification-bell';
import { CommunitySearchBox } from '@/components/community/community-search-box';

const NAV_LINKS = [
  { href: '/exams', label: 'Exams' },
  { href: '/practice', label: 'Practice' },
  { href: '/communities', label: 'Communities' },
  { href: '/mocks', label: 'Mock Tests' },
];

export function CommunitiesHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Link href="/" className="flex shrink-0 items-center">
        <NextImage src="/logo.svg" alt="scholar247" width={120} height={25} className="dark:invert" />
      </Link>

      <CommunitySearchBox className="hidden max-w-md flex-1 md:block" />

      <nav className="ml-auto hidden items-center gap-1 xl:flex">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1.5">
        {session?.user && <NotificationBell />}
        <ThemeToggle />
        {session?.user ? (
          <UserMenu showDashboard />
        ) : (
          <Button size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
