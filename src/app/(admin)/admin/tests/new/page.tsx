import { Metadata } from 'next';
import { TestBuilderClient } from '../test-builder-client';

export const metadata: Metadata = { title: 'New Test' };

export default function NewTestPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Test</h1>
        <p className="text-muted-foreground mt-1">Build a new assigned test with a step-by-step wizard</p>
      </div>
      <TestBuilderClient mode="create" />
    </div>
  );
}
