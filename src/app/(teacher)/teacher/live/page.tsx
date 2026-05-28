import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TeacherAllLiveClient } from './teacher-all-live-client';

export const metadata: Metadata = { title: 'Live Sessions | Teacher' };

export default async function TeacherLivePage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { sessions: allSessions, courseMap } = await serverGet<{ sessions: any[]; courseMap: Record<string, any> }>('/api/teacher/live');

  return <TeacherAllLiveClient sessions={allSessions} courseMap={courseMap} />;
}
