import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { AdminStudentsClient } from './admin-students-client';

export const metadata: Metadata = { title: 'Students | Admin' };

export default async function AdminStudentsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) redirect('/dashboard');

  const { courseId } = await params;

  const [data, courseInfo] = await Promise.all([
    serverGet<any[]>(`/api/admin/courses/${courseId}/students`).catch(() => []),
    serverGet<{ course: any }>(`/api/admin/courses/${courseId}`).catch(() => ({ course: null })),
  ]);

  if (!courseInfo.course) notFound();

  return <AdminStudentsClient courseId={courseId} courseTitle={courseInfo.course.title} enrollments={data} />;
}
