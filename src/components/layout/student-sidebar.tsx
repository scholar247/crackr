'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  TrendingUp,
  Map,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  GraduationCap,
  Layers,
  Video,
  CalendarDays,
  Target,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { usePracticeStore } from '@/stores/practice-store';

const NAV_ITEMS: { label: string; href: string; icon: React.ElementType; highlight?: boolean }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Study Plan', href: '/study-plan', icon: CalendarDays },
  { label: 'My Courses', href: '/my-courses', icon: Library },
  // { label: 'All Courses', href: '/courses', icon: Video },
  { label: 'Practice', href: '/practice', icon: BookOpen },
  { label: 'Mock Tests', href: '/mocks', icon: ClipboardList },
  { label: 'Tests', href: '/tests', icon: FileText },
  { label: 'Syllabus', href: '/syllabus', icon: Map },
  { label: 'Progress', href: '/progress', icon: TrendingUp },
  { label: 'Subjects', href: '/subjects', icon: Layers },
  { label: 'Exams', href: '/exams', icon: GraduationCap },
];

const BOTTOM_ITEMS = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
  highlight?: boolean;
}

function SidebarLink({ href, icon: Icon, label, collapsed, active, highlight }: SidebarLinkProps) {
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
                  : highlight
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
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
        'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : highlight
          ? 'text-primary bg-primary/10 hover:bg-primary/20'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

/** Session XP widget shown at the bottom of the sidebar */
function SessionXpWidget({ collapsed }: { collapsed: boolean }) {
  const { stats } = usePracticeStore();
  if (stats.xp === 0 && stats.correct === 0) return null;

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 cursor-default"
                 style={{ backgroundColor: 'color-mix(in oklch, var(--color-gold) 20%, transparent)' }}>
              <Star className="h-4 w-4" style={{ color: 'var(--color-gold)' }} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{stats.xp} XP this session</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="rounded-lg border px-3 py-2.5 space-y-1.5"
         style={{ borderColor: 'color-mix(in oklch, var(--color-gold) 30%, transparent)', backgroundColor: 'color-mix(in oklch, var(--color-gold) 8%, transparent)' }}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-gold)' }}>
          <Star className="h-3.5 w-3.5" />
          Session XP
        </span>
        <span className="font-bold" style={{ color: 'var(--color-gold)' }}>{stats.xp}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="text-success font-medium">✓ {stats.correct}</span>
        <span className="text-destructive font-medium">✗ {stats.incorrect}</span>
        {stats.streak > 0 && <span className="font-medium">🔥 {stats.streak}</span>}
      </div>
    </div>
  );
}

interface StudentSidebarProps {
  targetExams?: { id: string; name: string; slug: string }[];
}

export function StudentSidebar({ targetExams = [] }: StudentSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-3 space-y-1' : 'px-3 space-y-1')}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
            highlight={item.highlight}
          />
        ))}

        {/* My Exams — dynamic based on user's target exams */}
        {targetExams.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                My Exams
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-border/50" />}
            {targetExams.map((exam) => (
              <SidebarLink
                key={exam.id}
                href={`/exam/${exam.slug}`}
                icon={Target}
                label={exam.name}
                collapsed={collapsed}
                active={pathname === `/exam/${exam.slug}`}
                highlight
              />
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-border py-4 shrink-0', collapsed ? 'px-3 space-y-1' : 'px-3 space-y-1')}>
        {/* Session XP widget */}
        <div className="mb-2">
          <SessionXpWidget collapsed={collapsed} />
        </div>

        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={pathname === item.href}
          />
        ))}

        {/* Collapse toggle */}
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
