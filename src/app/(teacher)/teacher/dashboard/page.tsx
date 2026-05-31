import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TeacherDashboardClient } from './teacher-dashboard-client';

export const metadata: Metadata = { title: 'Teacher Dashboard | scholar247' };

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { courses, upcomingSessions, liveNow, stats } = await serverGet<any>('/api/teacher/dashboard');

  return (
    <TeacherDashboardClient
      teacherName={session.user.name ?? 'Teacher'}
      courses={courses}
      upcomingSessions={upcomingSessions}
      liveNow={liveNow}
      stats={stats}
    />
  );
}
