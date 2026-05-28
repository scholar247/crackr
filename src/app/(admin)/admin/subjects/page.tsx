import { Metadata } from 'next';
import { SubjectsClient } from './subjects-client';

export const metadata: Metadata = { title: 'Subjects | Admin' };

export default function AdminSubjectsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subjects</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage subjects and their settings</p>
      </div>
      <SubjectsClient />
    </div>
  );
}
