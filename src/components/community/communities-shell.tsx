'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { CommunitiesHeader } from '@/components/community/communities-header';
import { CommunitiesSidebar, type SidebarCommunity } from '@/components/community/communities-sidebar';

export function CommunitiesShell({ mine, children }: { mine: SidebarCommunity[]; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <CommunitiesHeader onMenuClick={() => setMobileOpen(true)} />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <CommunitiesSidebar mine={mine} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Communities navigation</SheetTitle>
          <CommunitiesSidebar mine={mine} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
