import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { ContentClient } from './content-client';

export async function generateMetadata(
  { params }: { params: Promise<{ courseId: string }> }
): Promise<Metadata> {
  const { courseId } = await params;
  try {
    const data = await serverGet<{ course: any; curriculum: any[] }>(`/api/teacher/courses/${courseId}/curriculum`);
    return { title: data?.course ? `Content: ${data.course.title} | crackr` : 'Lesson Content | crackr' };
  } catch {
    return { title: 'Lesson Content | crackr' };
  }
}

export default async function TeacherContentPage(
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/sign-in');
  }

  const { courseId } = await params;

  const { course, curriculum } = await serverGet<{ course: any; curriculum: any[] }>(`/api/teacher/courses/${courseId}/curriculum`).catch(() => ({ course: null, curriculum: [] }));
  if (!course) notFound();

  if (session.user.role === 'TEACHER' && !course.teacherIds.includes(session.user.id)) {
    redirect('/teacher/courses');
  }

  return (
    <ContentClient
      courseId={courseId}
      courseTitle={course.title}
      curriculum={curriculum}
    />
  );
}
