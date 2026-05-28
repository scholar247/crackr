'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Edit, BarChart2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_COLORS } from '@/lib/utils';
import type { TestClient } from '@/types';

async function fetchTests() {
  return ((await (await fetch('/api/admin/tests')).json()).data) as TestClient[];
}

export function TestListClient() {
  const { data: tests, isLoading } = useQuery({ queryKey: ['admin-tests'], queryFn: fetchTests });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  if (!tests?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-4xl mb-3">📝</p>
        <p className="font-medium">No tests created yet</p>
        <Button asChild className="mt-4">
          <Link href="/admin/tests/new">Create your first test</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Title</th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Questions</th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Duration</th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
            <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tests.map((test, i) => (
            <tr key={test.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
              <td className="px-4 py-3">
                <div className="font-medium text-sm">{test.title}</div>
                {test.description && (
                  <div className="text-xs text-muted-foreground truncate max-w-xs">{test.description}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{test.mcqIds.length}</td>
              <td className="px-4 py-3 text-sm">{test.duration} min</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={`text-xs ${STATUS_COLORS[test.status]}`}>
                  {test.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/admin/tests/${test.id}/analytics`}>
                      <BarChart2 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/admin/tests/${test.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
