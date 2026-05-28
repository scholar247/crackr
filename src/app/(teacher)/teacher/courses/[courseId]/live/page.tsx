import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TeacherLiveManagerClient } from './teacher-live-manager-client';

export const metadata: Metadata = { title: 'Live Sessions | Teacher' };

export default async function TeacherLivePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { courseId } = await params;

  const { courseTitle, sessions, teacherId: tid } = await serverGet<{ courseTitle: string; sessions: any[]; teacherId: string }>(`/api/teacher/courses/${courseId}/live-sessions`).catch(() => ({ courseTitle: '', sessions: [], teacherId: session.user.id }));

  return (
    <TeacherLiveManagerClient
      courseId={courseId}
      courseTitle={courseTitle}
      sessions={sessions}
      teacherId={tid}
    />
  );
}
