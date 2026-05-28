import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ClipboardList, Users, Activity, Plus, BarChart2, Tag, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminDashboardStats } from './admin-dashboard-stats';

export const metadata: Metadata = { title: 'Admin Dashboard | crackr' };

const QUICK_ACTIONS = [
  { label: 'New MCQ', href: '/admin/mcq/new', icon: Plus },
  { label: 'New Test', href: '/admin/tests/new', icon: ClipboardList },
  { label: 'Manage Subjects', href: '/admin/subjects', icon: FolderOpen },
  { label: 'Manage Tags', href: '/admin/tags', icon: Tag },
  { label: 'Manage Users', href: '/admin/users', icon: Users },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview</p>
      </div>

      <AdminDashboardStats />

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
            <Button key={href} variant="outline" size="sm" asChild>
              <Link href={href}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
