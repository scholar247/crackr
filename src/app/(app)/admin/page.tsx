import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Admin dashboard</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Curriculum, exams, and blog management live in the sidebar.</p>
    </div>
  );
}
