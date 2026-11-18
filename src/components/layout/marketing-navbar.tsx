'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BookOpen, GraduationCap, Menu, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/exams', label: 'Exams', icon: GraduationCap },
  { href: '/practice', label: 'Practice', icon: Target },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/blogs', label: 'Blog', icon: BookOpen },
];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
        'sticky top-0 z-40 flex h-14 items-center border-b transition-all duration-200',
        showSolidHeader ? 'border-border bg-background/95 backdrop-blur' : 'border-transparent bg-transparent',
      )}
    >
      {/* Phones and tablets: logo · actions · menu button. Laptops: three columns with the links centred. */}
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-3 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:justify-normal lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex shrink-0 items-center">
            <Logo width={128} height={27} priority />
          </Link>
        </div>

        <nav aria-label="Main" className="hidden items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground',
                isActive(pathname, link.href) ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <ThemeToggle />
          {session?.user ? (
            <UserMenu showDashboard />
          ) : (
            <Button size="sm" className="whitespace-nowrap" asChild>
              <Link href="/sign-in">
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Get started free</span>
              </Link>
            </Button>
          )}

          {/* Menu for phones and tablets */}
          <Sheet>
            <SheetTrigger asChild>
              <button type="button" aria-label="Open menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[82%] flex-col p-0 sm:max-w-sm">
              <div className="border-b border-border p-5">
                <SheetTitle asChild>
                  <span>
                    <Logo width={128} height={27} />
                  </span>
                </SheetTitle>
                <p className="mt-1 text-xs text-muted-foreground">Learn · Practice · Progress · Crack</p>
              </div>
              <nav aria-label="Main" className="flex flex-col gap-1 p-3">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      aria-current={isActive(pathname, href) ? 'page' : undefined}
                      className={cn(
                        'flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors',
                        isActive(pathname, href) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isActive(pathname, href) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {!session?.user && (
                <div className="mt-auto border-t border-border p-4">
                  <SheetClose asChild>
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/sign-in">Get started free</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
