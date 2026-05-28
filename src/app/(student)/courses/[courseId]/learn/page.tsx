import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { CoursePlayerClient } from './course-player-client';

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId } = await params;
  try {
    const data = await serverGet<{ courseTitle: string }>(`/api/student/courses/${courseId}/learn`);
    return { title: `Learn: ${data.courseTitle} | crackr` };
  } catch {
    return { title: 'Course Player | crackr' };
  }
}

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { courseId } = await params;
  const { lesson: lessonId } = await searchParams;

  const lessonParam = lessonId ? `?lesson=${lessonId}` : '';
  let data: {
    courseId: string; courseTitle: string; curriculum: any[];
    activeLesson: any | null; activeLessonId: string | undefined;
    prevLesson: any | null; nextLesson: any | null;
    progress: number; upcomingSessions: any[]; announcements: any[];
  } | null = null;

  try {
    data = await serverGet(`/api/student/courses/${courseId}/learn${lessonParam}`);
  } catch (err: any) {
    // 403 = not enrolled
    if (err?.message?.includes('403')) redirect(`/courses/${courseId}`);
    notFound();
  }

  if (!data) notFound();

  return (
    <CoursePlayerClient
      courseId={data.courseId}
      courseTitle={data.courseTitle}
      curriculum={data.curriculum}
      activeLesson={data.activeLesson}
      activeLessonId={data.activeLessonId}
      prevLesson={data.prevLesson}
      nextLesson={data.nextLesson}
      progress={data.progress}
      upcomingSessions={data.upcomingSessions}
      announcements={data.announcements}
    />
  );
}
