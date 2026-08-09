'use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOut, Settings, LayoutDashboard, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ROLE_COLORS } from '@/lib/utils';
import Link from 'next/link';
import { defaultDashboardPath, type UserRole } from '@/lib/roles';

interface UserMenuProps {
  /** Show a Dashboard link at the top of the menu (useful on the landing page) */
  showDashboard?: boolean;
}

export function UserMenu({ showDashboard = false }: UserMenuProps) {
  const { data: session } = useSession();
  const { setTheme } = useTheme();

  if (!session?.user) return null;

  const { name, email, image, role } = session.user as { name?: string; email?: string; image?: string; role: UserRole };
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? 'U';

  const dashboardHref = defaultDashboardPath(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
          <Avatar className="h-8 w-8">
            <AvatarImage src={image ?? ''} alt={name ?? ''} />
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium leading-none">{name}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{email}</span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{name}</span>
            <span className="text-xs text-muted-foreground font-normal">{email}</span>
            <Badge className={`w-fit text-xs mt-1 ${ROLE_COLORS[role]}`} variant="outline">
              {role.replace('_', ' ')}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {showDashboard && (
          <DropdownMenuItem asChild>
            <Link href={dashboardHref}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-transform absolute" />
            <Moon className="h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-transform absolute" />
            <span className="pl-6">Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
