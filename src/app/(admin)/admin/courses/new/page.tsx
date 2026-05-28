import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { CourseCreatorClient } from './course-creator-client';

export const metadata: Metadata = { title: 'New Course | Admin' };

export default async function NewCoursePage() {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) redirect('/dashboard');

  const [exams, teachers] = await Promise.all([
    serverGet<any[]>('/api/admin/exams'),
    serverGet<any[]>('/api/admin/teachers'),
  ]);

  return <CourseCreatorClient exams={exams} teachers={teachers} />;
}
