import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { TestResultsClient } from './test-results-client';

export const metadata: Metadata = { title: 'Test Results' };

export default async function TestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const data = await serverGet<{ test: any; attempt: any; mcqs: any[] }>(
    `/api/student/tests/${id}/results`
  ).catch(() => null);

  if (!data?.test) notFound();
  if (!data.attempt) redirect(`/tests/${id}/take`);

  const { test, attempt, mcqs } = data;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{test.title}</h1>
        <p className="text-muted-foreground mt-1">Test Results</p>
      </div>
      <TestResultsClient
        test={test}
        attempt={attempt}
        mcqs={mcqs}
        showExplanation={test.showExplanation !== 'NEVER'}
      />
    </div>
  );
}
