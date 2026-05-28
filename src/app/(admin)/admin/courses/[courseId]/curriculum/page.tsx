import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { CurriculumBuilderClient } from './curriculum-builder-client';

export const metadata: Metadata = { title: 'Curriculum Builder | Admin' };

export default async function CurriculumBuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) redirect('/dashboard');

  const { courseId } = await params;

  const { course, curriculum } = await serverGet<{ course: any; curriculum: any[] }>(`/api/teacher/courses/${courseId}/curriculum`).catch(() => ({ course: null, curriculum: [] }));
  if (!course) notFound();

  return (
    <CurriculumBuilderClient
      courseId={courseId}
      courseTitle={course.title}
      initialCurriculum={curriculum}
    />
  );
}
