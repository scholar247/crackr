import { Metadata } from 'next';
import { BlogForm } from '@/components/editor/blog-form';

export const metadata: Metadata = { title: 'New Blog' };

export default function NewBlogPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Blog</h1>
        <p className="text-muted-foreground mt-1">Add a new blog post</p>
      </div>
      <BlogForm mode="create" />
    </div>
  );
}
