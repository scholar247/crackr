'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldCheck, LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/communities', label: 'Communities Home', icon: Home },
  { href: '/communities/official', label: 'Official Communities', icon: ShieldCheck },
  { href: '/communities/hub', label: 'My Hub', icon: LayoutGrid },
] as const;

export interface SidebarCommunity {
  slug: string;
  name: string;
}

export function CommunitiesSidebar({ mine, onNavigate }: { mine: SidebarCommunity[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <nav className="space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </Link>
          );
        })}
      </nav>

      {mine.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="px-3 text-label-caps uppercase text-muted-foreground">My Communities</p>
          <nav className="mt-2 space-y-0.5">
            {mine.map((c) => (
              <Link
                key={c.slug}
                href={`/communities/${c.slug}`}
                onClick={onNavigate}
                className={cn(
                  'block truncate rounded-lg px-3 py-1.5 text-sm transition-colors',
                  pathname === `/communities/${c.slug}` ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <Button asChild className="mt-auto">
        <Link href="/communities/new" onClick={onNavigate}>
          <Plus className="h-4 w-4" /> Create Community
        </Link>
      </Button>
    </div>
  );
}
