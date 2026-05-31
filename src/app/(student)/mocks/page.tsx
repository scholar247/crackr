import { Metadata } from 'next';
import { MocksClient } from './mocks-client';
import { SectionErrorBoundary } from '@/components/shared/section-error';

export const metadata: Metadata = {
  title: 'Mock Tests | scholar247',
  description: 'Generate and take timed full-length mock tests. See your rank and percentile.',
};

export default function MocksPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mock Tests</h1>
        <p className="text-muted-foreground mt-1">Generate and take custom mock tests</p>
      </div>
      <SectionErrorBoundary>
        <MocksClient />
      </SectionErrorBoundary>
    </div>
  );
}
