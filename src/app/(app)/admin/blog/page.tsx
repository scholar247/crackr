import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { BlogListClient } from './blog-list-client';

export default async function AdminBlogPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'TEACHER')) {
    redirect('/dashboard');
  }

  return <BlogListClient />;
}
