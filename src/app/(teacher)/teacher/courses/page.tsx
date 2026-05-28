import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TeacherCoursesClient } from './teacher-courses-client';

export const metadata: Metadata = { title: 'My Courses | Teacher' };

export default async function TeacherCoursesPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const courseData = await serverGet<any[]>('/api/teacher/courses');

  return <TeacherCoursesClient courses={courseData} />;
}
