import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { BlogForm } from '@/components/editor/blog-form';

export default async function NewBlogPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'TEACHER')) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New article</h1>
      <div className="mt-6">
        <BlogForm mode="create" />
      </div>
    </div>
  );
}
