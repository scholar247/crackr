import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { TestTakeClient } from './test-take-client';

export default async function TestTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const data = await serverGet<{ test: any; attempt: any; mcqs: any[] }>(
    `/api/student/tests/${id}/take`
  ).catch(() => null);

  if (!data?.test) notFound();

  const { test, attempt, mcqs } = data;

  // Already submitted — go to results
  if (attempt.status !== 'IN_PROGRESS') redirect(`/tests/${id}/results`);

  return (
    <TestTakeClient
      testId={id}
      attemptId={attempt.id}
      mcqs={mcqs}
      startedAt={attempt.startedAt}
      durationSeconds={test.duration * 60}
    />
  );
}
