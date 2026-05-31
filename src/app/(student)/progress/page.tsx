import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { ProgressClient } from './progress-client';
import { SectionErrorBoundary } from '@/components/shared/section-error';

export const metadata: Metadata = {
  title: 'Progress | scholar247',
  description: 'Track your learning progress',
};

export default async function ProgressPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const subjects = await serverGet<any[]>('/api/public/subjects').catch(() => []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your performance across tests and practice sessions
        </p>
      </div>
      <SectionErrorBoundary>
        <ProgressClient subjects={subjects} />
      </SectionErrorBoundary>
    </div>
  );
}
