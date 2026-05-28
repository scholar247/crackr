'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  ChevronLeft,
  ChevronRight,
  Settings,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { label: 'My Courses', href: '/teacher/courses', icon: Video },
      { label: 'Live Sessions', href: '/teacher/live', icon: Radio },
    ],
  },
];

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
}

function SidebarLink({ href, icon: Icon, label, collapsed, active }: SidebarLinkProps) {
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function TeacherSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {group.label}
              </p>
            )}
            {collapsed && <Separator className="my-1" />}
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                collapsed={collapsed}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-border py-4 shrink-0', 'px-3 space-y-1')}>
        <SidebarLink
          href="/teacher/settings"
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
          active={pathname === '/teacher/settings'}
        />

        <Button
          variant="ghost"
          size="icon"
          className="mt-2 w-full h-8 flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
