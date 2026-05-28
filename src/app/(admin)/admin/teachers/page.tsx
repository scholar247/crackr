import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { AdminTeachersClient } from './admin-teachers-client';

export const metadata: Metadata = { title: 'Teachers | Admin' };

export default async function AdminTeachersPage() {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) redirect('/dashboard');

  const teacherData = await serverGet<any[]>('/api/admin/teachers-full').catch(() => []);

  return <AdminTeachersClient teachers={teacherData} />;
}
