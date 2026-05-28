import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { MockTakeClient } from './mock-take-client';

export default async function MockTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const { mock, mcqs: orderedMcqs } = await serverGet<{ mock: any; mcqs: any[] }>(`/api/student/mocks/${id}/full`);
  if (!mock || mock.userId !== session.user.id) notFound();

  // Already submitted
  if (mock.attempt) redirect(`/mocks/${id}/results`);

  return (
    <MockTakeClient
      mockId={id}
      mcqs={orderedMcqs}
      startedAt={mock.createdAt}
      durationSeconds={mock.filters.duration ? mock.filters.duration * 60 : undefined}
    />
  );
}
