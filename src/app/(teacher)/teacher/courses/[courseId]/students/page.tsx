import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TeacherStudentsClient } from './teacher-students-client';

export const metadata: Metadata = { title: 'Students | Teacher' };

export default async function TeacherStudentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { courseId } = await params;

  const { courseTitle, enrollments: enriched } = await serverGet<{ courseTitle: string; enrollments: any[] }>(`/api/teacher/courses/${courseId}/students`).catch(() => ({ courseTitle: '', enrollments: [] }));

  return (
    <TeacherStudentsClient
      courseTitle={courseTitle}
      enrollments={enriched}
    />
  );
}
