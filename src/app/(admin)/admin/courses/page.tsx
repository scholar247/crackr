import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Video, Users, Radio, Archive } from 'lucide-react';
import { serverGet } from '@/lib/server-fetch';
import { Button } from '@/components/ui/button';
import { AdminCourseListClient } from './admin-course-list-client';

export const metadata: Metadata = { title: 'Courses | Admin' };

export default async function AdminCoursesPage() {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard');
  }

  const [stats, exams, teachers] = await Promise.all([
    serverGet<any>('/api/admin/courses/stats'),
    serverGet<any[]>('/api/admin/exams'),
    serverGet<any[]>('/api/admin/teachers'),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all courses</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Quick stats — server-rendered, no loading state needed */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Video },
          { label: 'Published', value: stats.published, icon: Archive },
          { label: 'Live Now', value: stats.liveNow, icon: Radio },
          { label: 'Enrolled', value: stats.totalEnrolled.toLocaleString(), icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Course list — client-side with API fetch + skeleton */}
      <AdminCourseListClient exams={exams} teachers={teachers} />
    </div>
  );
}
