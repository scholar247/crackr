import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'TEACHER')) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Teacher dashboard</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Your owned content and (later) tests scoped to your audience will show up here.
      </p>
    </div>
  );
}
