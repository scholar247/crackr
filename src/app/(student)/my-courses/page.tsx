import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { MyCoursesClient } from './my-courses-client';

export const metadata: Metadata = { title: 'My Courses | crackr' };

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const courses = await serverGet<any[]>('/api/student/my-courses').catch(() => []);

  return <MyCoursesClient courses={courses} />;
}
