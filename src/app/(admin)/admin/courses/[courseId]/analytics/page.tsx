import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { CourseAnalyticsClient } from './course-analytics-client';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  return { title: 'Course Analytics | Admin' };
}

export default async function CourseAnalyticsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) redirect('/dashboard');

  const { courseId } = await params;

  const [analytics, courseData] = await Promise.all([
    serverGet<any>(`/api/admin/courses/${courseId}/analytics`).catch(() => null),
    serverGet<{ course: any }>(`/api/admin/courses/${courseId}`).catch(() => ({ course: null })),
  ]);

  if (!courseData.course) notFound();

  return <CourseAnalyticsClient courseTitle={courseData.course.title} analytics={analytics} />;
}
