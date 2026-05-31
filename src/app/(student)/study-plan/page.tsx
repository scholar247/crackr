import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { StudyPlanClient } from './study-plan-client';

export const metadata: Metadata = { title: 'Study Plan | scholar247' };

const NIMCET_EXAM_DATE = '2025-06-01T09:00:00+05:30';

export default async function StudyPlanPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { dailyGoal, nimcetExam, nimcetSubjects, enrolledCourses, userName } =
    await serverGet<any>('/api/student/study-plan').catch(() => ({
      dailyGoal: 20, nimcetExam: null, nimcetSubjects: [], enrolledCourses: [], userName: session.user.name ?? 'Student'
    }));

  return (
    <StudyPlanClient
      examDate={NIMCET_EXAM_DATE}
      enrolledCourses={enrolledCourses}
      coverage={nimcetSubjects}
      dailyGoal={dailyGoal}
      examId={nimcetExam?.id}
      userName={userName}
    />
  );
}
