import { Metadata } from 'next';
import { TopicsClient } from './topics-client';

export const metadata: Metadata = { title: 'Topic Manager | Admin' };

export default function AdminTopicsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Topic Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the subject → chapter → section → subtopic hierarchy
        </p>
      </div>
      <TopicsClient />
    </div>
  );
}
