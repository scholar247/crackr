import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TestsListClient } from './tests-list-client';
import { SectionErrorBoundary } from '@/components/shared/section-error';

export const metadata: Metadata = { title: 'Tests' };

export default async function TestsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const enriched = await serverGet<any[]>('/api/student/tests/with-attempts').catch(() => []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
        <p className="text-muted-foreground mt-1">Assigned tests available to you</p>
      </div>
      <SectionErrorBoundary>
        <TestsListClient tests={enriched} />
      </SectionErrorBoundary>
    </div>
  );
}
