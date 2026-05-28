import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { MockResultsClient } from './mock-results-client';

export const metadata: Metadata = { title: 'Mock Results' };

export default async function MockResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const { mock, mcqs: orderedMcqs } = await serverGet<{ mock: any; mcqs: any[] }>(`/api/student/mocks/${id}/full`);
  if (!mock || mock.userId !== session.user.id) notFound();
  if (!mock.attempt) redirect(`/mocks/${id}/take`);

  return (
    <MockResultsClient
      mock={mock}
      mcqs={orderedMcqs}
    />
  );
}
