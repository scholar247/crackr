'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CategoriesClient() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="rounded-full bg-muted p-4">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">Categories have been replaced by Topics</h2>
      <p className="text-muted-foreground max-w-sm">
        The taxonomy system has been upgraded to a multi-level Topic tree.
        Manage your subjects and topics from the Topics page.
      </p>
      <Button asChild>
        <Link href="/admin/topics">
          Go to Topic Manager
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
