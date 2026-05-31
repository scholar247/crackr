import { auth } from '@/lib/auth';
import { LandingPage } from '@/components/landing/landing-page';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-fetch';

export const metadata: Metadata = {
  title: 'scholar247 — Learn, Practice, Progress, Crack Exams',
  description:
    'The smartest way to prepare for competitive exams. Practice thousands of MCQs, take timed mock tests, track your progress with analytics, and crack your target exam.',
  openGraph: {
    title: 'scholar247 — Crack Your Exam',
    description: 'Practice MCQs, take mock tests, track progress. Built for exam toppers.',
    type: 'website',
  },
};

export default async function HomePage() {
  const session = await auth();

  let enrolledCourseId: string | null = null;
  if (session?.user?.id) {
    try {
      const data = await serverGet<{ courseId: string | null }>('/api/student/active-enrollment');
      enrolledCourseId = data?.courseId ?? null;
    } catch { /* ok */ }
  }

  return <LandingPage session={session} enrolledCourseId={enrolledCourseId} />;
}
