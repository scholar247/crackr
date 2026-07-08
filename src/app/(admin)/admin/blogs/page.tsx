import { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogListClient } from './blog-list-client';

export const metadata: Metadata = { title: 'Blog Management' };

export default function BlogsAdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blogs</h1>
          <p className="text-muted-foreground mt-1">Manage your blog content</p>
        </div>
        <Button asChild>
          <Link href="/admin/blogs/new">
            <Plus className="h-4 w-4" />
            New Blog
          </Link>
        </Button>
      </div>
      <BlogListClient />
    </div>
  );
}
