import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import type { BlogClient } from '@/types';
import { BlogPreviewClient } from './preview-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BlogPreviewPage({ params }: Props) {
  const { id } = await params;

  let blog: BlogClient;
  try {
    blog = await serverGet<BlogClient>(`/api/admin/blogs/${id}`);
  } catch {
    notFound();
  }

  return <BlogPreviewClient initialBlog={blog} cacheKey={`blog-draft-${id}`} />;
}
