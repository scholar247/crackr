import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { BlogForm } from '@/components/editor/blog-form';

export const metadata: Metadata = { title: 'Edit Blog' };

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await serverGet<any>(`/api/admin/blogs/${id}`).catch(() => null);
  if (!blog) notFound();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Blog</h1>
        <p className="text-muted-foreground mt-1">Update blog content and settings</p>
      </div>
      <BlogForm mode="edit" initialData={blog} />
    </div>
  );
}
