import { Metadata } from 'next';
import { TagsClient } from './tags-client';

export const metadata: Metadata = { title: 'Tags | Admin' };

export default function AdminTagsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage MCQ tags and merge duplicates</p>
      </div>
      <TagsClient />
    </div>
  );
}
