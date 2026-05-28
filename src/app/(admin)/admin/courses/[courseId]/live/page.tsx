import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { AdminLiveManagerClient } from './admin-live-manager-client';

export const metadata: Metadata = { title: 'Live Sessions | Admin' };

export default async function AdminLiveManagerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) redirect('/dashboard');

  const { courseId } = await params;

  const { course, sessions, teachers } = await serverGet<{ course: any; sessions: any[]; teachers: any[] }>(`/api/admin/courses/${courseId}/live-page`).catch(() => ({ course: null, sessions: [], teachers: [] }));
  if (!course) notFound();

  return (
    <AdminLiveManagerClient
      courseId={courseId}
      courseTitle={course.title}
      courseTeacherIds={course.teacherIds}
      sessions={sessions}
      teachers={teachers}
    />
  );
}
