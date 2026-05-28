import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { EditCourseClient } from './edit-client';

export const metadata: Metadata = { title: 'Edit Course | Admin' };

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard');
  }

  const { courseId } = await params;

  const [exams, teachers] = await Promise.all([
    serverGet<any[]>('/api/admin/exams'),
    serverGet<any[]>('/api/admin/teachers'),
  ]);

  return <EditCourseClient courseId={courseId} exams={exams} teachers={teachers} />;
}
