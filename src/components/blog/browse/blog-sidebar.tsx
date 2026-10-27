import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  label: string;
  href: string;
  count: number;
  active?: boolean;
}

interface BlogSidebarProps {
  title: string;
  items: SidebarItem[];
  /** Link one level up ("All exams", the exam, the subject…). */
  back?: { label: string; href: string };
  emptyText?: string;
}

// The drill-down table: exams → subjects → chapters → topics. Each row links to the next
// level's listing; the count is the published blogs under that node.
export function BlogSidebar({ title, items, back, emptyText = 'Nothing more to drill into here.' }: BlogSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {back && (
          <Link
            href={back.href}
            className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {back.label}
          </Link>
        )}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
          <h2 className="text-label-caps uppercase tracking-wider text-muted-foreground">{title}</h2>
          <span className="text-label-caps uppercase tracking-wider text-muted-foreground">Blogs</span>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50',
                    item.active ? 'bg-primary/10 font-medium text-primary' : 'text-foreground',
                    item.count === 0 && !item.active && 'text-muted-foreground'
                  )}
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
