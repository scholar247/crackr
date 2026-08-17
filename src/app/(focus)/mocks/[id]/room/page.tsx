import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { ExamRoomClient } from '@/components/mocks/exam-room-client';

export default async function ExamRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const { attempt: attemptId } = await searchParams;
  if (!attemptId) redirect(`/mocks/${id}`);

  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) notFound();

  const detail = await assessmentRepository.findByIdWithSections(id);
  if (!detail) notFound();

  // Ownership/status of the specific attempt is re-verified by every API call the client
  // makes from here — this is just enough of a check to avoid rendering the room shell
  // for an attempt that's already finished.
  let state;
  try {
    state = await assessmentRepository.getAttemptState(id, attemptId, session!.user.id);
  } catch {
    redirect(`/mocks/${id}`);
  }
  if (state.attempt.status !== 'IN_PROGRESS') {
    redirect(`/mocks/${id}/results/${attemptId}`);
  }

  return (
    <ExamRoomClient
      assessmentId={id}
      attemptId={attemptId}
      sections={detail.sections.map((s) => ({ id: s.id, title: s.title }))}
    />
  );
}
