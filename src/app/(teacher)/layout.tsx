import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TeacherSidebar } from '@/components/layout/teacher-sidebar';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/sign-in');
  if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <TeacherSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
