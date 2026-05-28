import { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MCQListClient } from './mcq-list-client';

export const metadata: Metadata = { title: 'MCQ Management' };

export default function MCQPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MCQs</h1>
          <p className="text-muted-foreground mt-1">Manage your question bank</p>
        </div>
        <Button asChild>
          <Link href="/admin/mcq/new">
            <Plus className="h-4 w-4" />
            New MCQ
          </Link>
        </Button>
      </div>

      <MCQListClient />
    </div>
  );
}
