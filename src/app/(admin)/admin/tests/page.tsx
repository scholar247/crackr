import { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestListClient } from './test-list-client';

export const metadata: Metadata = { title: 'Tests' };

export default function AdminTestsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
          <p className="text-muted-foreground mt-1">Create and manage assigned tests</p>
        </div>
        <Button asChild>
          <Link href="/admin/tests/new">
            <Plus className="h-4 w-4" />
            New Test
          </Link>
        </Button>
      </div>
      <TestListClient />
    </div>
  );
}
