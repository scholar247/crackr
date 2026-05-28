'use client';

import { useRouter } from 'next/navigation';
import { TestTakingUI } from '@/components/shared/test-taking-ui';
import type { MCQClient } from '@/types';
import type { SubmitAttemptInput } from '@/schemas';

interface MockTakeClientProps {
  mockId: string;
  mcqs: MCQClient[];
  startedAt: string;
  durationSeconds?: number;
}

export function MockTakeClient({ mockId, mcqs, startedAt, durationSeconds }: MockTakeClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: SubmitAttemptInput) => {
    const res = await fetch(`/api/mocks/${mockId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Submission failed');
    }
    router.push(`/mocks/${mockId}/results`);
    router.refresh();
  };

  return (
    <TestTakingUI
      mcqs={mcqs}
      startedAt={startedAt}
      durationSeconds={durationSeconds}
      onSubmit={handleSubmit}
      submitLabel="Submit Mock"
    />
  );
}
