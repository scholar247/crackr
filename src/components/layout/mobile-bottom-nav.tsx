'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, ClipboardList, CalendarDays, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'NIMCET', href: '/nimcet', icon: Target },
  { label: 'Practice', href: '/practice', icon: BookOpen },
  { label: 'Mocks', href: '/mocks', icon: ClipboardList },
  { label: 'Plan', href: '/study-plan', icon: CalendarDays },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur px-2">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs',
              active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={label}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
            <span className="leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
