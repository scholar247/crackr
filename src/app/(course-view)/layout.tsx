import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CourseListSidebar } from '@/components/layout/course-list-sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export default async function CourseViewLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <CourseListSidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
